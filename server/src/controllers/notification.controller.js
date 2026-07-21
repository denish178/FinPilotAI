import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as notificationService from "../services/notification.service.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Notifications fetched successfully"),
    );
});

export const getUnreadNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadNotifications(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Unread notifications fetched successfully",
      ),
    );
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Unread count fetched successfully"));
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.user._id,
    req.params.id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, notification, "Notification marked as read"),
    );
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "All notifications marked as read",
      ),
    );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user._id, req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully"));
});
