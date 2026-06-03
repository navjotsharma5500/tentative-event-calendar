import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
            className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl z-10 overflow-hidden`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-display font-semibold text-slate-900 text-lg">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[80vh]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
