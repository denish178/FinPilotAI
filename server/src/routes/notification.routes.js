import { Router } from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import {
  listNotificationsValidator,
  notificationIdValidator,
} from "../validators/notification.validator.js";

const router = Router();

router.use(verifyJWT);

router.get("/", listNotificationsValidator, validate, getNotifications);
router.get(
  "/unread",
  listNotificationsValidator,
  validate,
  getUnreadNotifications,
);
router.get("/unread-count", getUnreadCount);

router.patch("/mark-all-read", markAllNotificationsAsRead);

router.patch(
  "/:id/read",
  notificationIdValidator,
  validate,
  markNotificationAsRead,
);

router.delete(
  "/:id",
  notificationIdValidator,
  validate,
  deleteNotification,
);

export default router;
