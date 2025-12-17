"use client";

import { useState } from "react";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  channel: 'sms' | 'whatsapp';
  conversationId: string;
}

export function SendMessageModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  channel,
  conversationId
}: SendMessageModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!customerPhone) {
      toast.error("Customer phone number not available");
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

      // Ensure phone number has + prefix
      let formattedPhone = customerPhone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
      }

      if (channel === 'sms') {
        // Send SMS via Python backend
        const COMM_API = process.env.NEXT_PUBLIC_COMM_API_URL || 'https://keplerov1-python-2.onrender.com';
        const response = await fetch(`${COMM_API}/sms/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: message,
            number: formattedPhone,
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send SMS');
        }

        toast.success('SMS sent successfully!');
      } else if (channel === 'whatsapp') {
        // Send WhatsApp message via Dialog360
        const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: message,
            sender: 'operator',
            type: 'message'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send WhatsApp message');
        }

        toast.success('WhatsApp message sent successfully!');
      }

      setMessage("");
      onClose();
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(error.message || `Failed to send ${channel} message`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Send {channel === 'sms' ? 'SMS' : 'WhatsApp'} Message
              </h2>
              <p className="text-sm text-muted-foreground">
                To {customerName} ({customerPhone || 'No phone'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            disabled={sending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Type your ${channel} message here...`}
              rows={6}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} characters
            </p>
          </div>

          {!customerPhone && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-400">
                ⚠️ Customer phone number is not available
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || !customerPhone}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

