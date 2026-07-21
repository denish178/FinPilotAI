import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";

export default function MobileDrawer({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
          >
            <Sidebar onNavigate={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
