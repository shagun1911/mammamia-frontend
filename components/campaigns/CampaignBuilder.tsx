"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactLists } from "@/hooks/useContacts";
import { AlertModal } from "@/components/ui/Modal";

interface CampaignBuilderProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export function CampaignBuilder({ onClose, onSave }: CampaignBuilderProps) {
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [contactList, setContactList] = useState("");

  // Communication types
  const [enableSMS, setEnableSMS] = useState(false);
  const [enableEmail, setEnableEmail] = useState(false);
  const [enableCall, setEnableCall] = useState(false);

  // SMS template
  const [smsMessage, setSmsMessage] = useState("");

  // Email template
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailIsHtml, setEmailIsHtml] = useState(false);

  // Call settings
  const [callPrompt, setCallPrompt] = useState("");
  const [callLanguage, setCallLanguage] = useState("en");
  const [callEmotion, setCallEmotion] = useState("Calm");

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  // Fetch lists from backend
  const { data: lists, isLoading: loadingLists } = useContactLists();

  const showAlert = (title: string, message: string, type: "error" | "warning" | "info" = "error") => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertModal({
      ...alertModal,
      isOpen: false,
    });
  };

  const steps = [
    { number: 1, label: "Details" },
    { number: 2, label: "Communication" },
    { number: 3, label: "Review & Send" },
  ];

  const handleNext = () => {
    // Validate step 1
    if (step === 1) {
      if (!campaignName.trim()) {
        showAlert("Campaign Name Required", "Please enter a campaign name to continue.", "warning");
        return;
      }
      if (!contactList) {
        showAlert("Contact List Required", "Please select a contact list to send this campaign to.", "warning");
        return;
      }
    }

    // Validate step 2
    if (step === 2) {
      if (!enableCall && !enableSMS && !enableEmail) {
        showAlert("Communication Channel Required", "Please select at least one communication type (Call, SMS, or Email).", "warning");
        return;
      }

      if (enableSMS && !smsMessage.trim()) {
        showAlert("SMS Message Required", "Please enter an SMS message to send to your contacts.", "warning");
        return;
      }

      if (enableEmail && (!emailSubject.trim() || !emailBody.trim())) {
        showAlert("Email Details Required", "Please enter both email subject and body to send emails.", "warning");
        return;
      }

      if (enableCall && !callPrompt.trim()) {
        showAlert("AI Instructions Required", "Please enter instructions for the AI agent to follow during calls.", "warning");
        return;
      }
    }

    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = () => {
    const communicationTypes = [];
    if (enableCall) communicationTypes.push("call");
    if (enableSMS) communicationTypes.push("sms");
    if (enableEmail) communicationTypes.push("email");

    // Final validation
    if (!campaignName.trim()) {
      showAlert("Campaign Name Required", "Please enter a campaign name before starting.", "error");
      return;
    }

    if (!contactList) {
      showAlert("Contact List Required", "Please select a contact list before starting.", "error");
      return;
    }

    if (communicationTypes.length === 0) {
      showAlert("Communication Channel Required", "Please select at least one communication type before starting.", "error");
      return;
    }

    onSave({
      name: campaignName,
      listId: contactList,
      communicationTypes,
      smsBody: enableSMS ? { message: smsMessage } : undefined,
      emailBody: enableEmail ? { 
        subject: emailSubject, 
        body: emailBody, 
        is_html: emailIsHtml 
      } : undefined,
      dynamicInstruction: enableCall ? callPrompt : undefined,
      language: enableCall ? callLanguage : undefined,
      emotion: enableCall ? callEmotion : undefined,
      // Send immediately - no scheduling
    });
  };

  return (
    <>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      <div className="max-w-4xl mx-auto p-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step > s.number
                    ? "bg-green-600 text-foreground"
                    : step === s.number
                    ? "bg-primary text-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {step > s.number ? <Check className="w-5 h-5" /> : s.number}
              </div>
              <span
                className={cn(
                  "mt-2 text-sm",
                  step >= s.number ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-24 h-0.5 mx-4",
                  step > s.number ? "bg-green-600" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-white mb-3">
                Campaign Name
              </label>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-white mb-3">
                Contact List
              </label>
              <select
                value={contactList}
                onChange={(e) => setContactList(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                disabled={loadingLists}
              >
                <option value="">Select list</option>
                {loadingLists ? (
                  <option disabled>Loading lists...</option>
                ) : lists && lists.length > 0 ? (
                  lists.map((list: any) => (
                    <option key={list.id || list._id} value={list.id || list._id}>
                      {list.name} ({list.contactCount || 0} contacts)
                    </option>
                  ))
                ) : (
                  <option disabled>No lists available. Create a list first.</option>
                )}
              </select>
              {!loadingLists && lists && lists.length === 0 && (
                <p className="text-xs text-yellow-400 mt-2">
                  You need to create a contact list first. Go to Contacts → Add List.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            <h3 className="text-base font-semibold text-white mb-4">
              Select Communication Channels
            </h3>

            {/* SMS Option */}
            <div className="border border-border rounded-lg p-4">
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSMS}
                  onChange={(e) => setEnableSMS(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-base font-semibold text-white">SMS Message</span>
              </label>
              {enableSMS && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Message Body
                  </label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Enter your SMS message..."
                    rows={3}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              )}
            </div>

            {/* Email Option */}
            <div className="border border-border rounded-lg p-4">
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEmail}
                  onChange={(e) => setEnableEmail(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-base font-semibold text-white">Email</span>
              </label>
              {enableEmail && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Subject
                    </label>
                    <input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject..."
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Body
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Enter email body..."
                      rows={4}
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailIsHtml}
                      onChange={(e) => setEmailIsHtml(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-sm text-muted-foreground">HTML Format</span>
                  </label>
                </div>
              )}
            </div>

            {/* Call Option */}
            <div className="border border-border rounded-lg p-4">
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCall}
                  onChange={(e) => setEnableCall(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-base font-semibold text-white">Phone Call (AI Agent)</span>
              </label>
              {enableCall && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      AI Instructions / Prompt
                    </label>
                    <textarea
                      value={callPrompt}
                      onChange={(e) => setCallPrompt(e.target.value)}
                      placeholder="Enter instructions for the AI agent..."
                      rows={4}
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Language
                      </label>
                      <select
                        value={callLanguage}
                        onChange={(e) => setCallLanguage(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="it">Italian</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Emotion
                      </label>
                      <select
                        value={callEmotion}
                        onChange={(e) => setCallEmotion(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="Calm">Calm</option>
                        <option value="Happy">Happy</option>
                        <option value="Excited">Excited</option>
                        <option value="Professional">Professional</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Review & Send Campaign</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Review your campaign details before sending. The campaign will be sent immediately to all contacts in the selected list.
              </p>
            </div>

            {/* Summary */}
            <div className="border border-border rounded-lg p-4 bg-secondary/30">
              <h4 className="text-sm font-semibold text-white mb-3">Campaign Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign Name:</span>
                  <span className="text-white font-medium">{campaignName || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">List:</span>
                  <span className="text-white">
                    {lists?.find((l: any) => (l.id || l._id) === contactList)?.name || "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contacts:</span>
                  <span className="text-white">
                    {lists?.find((l: any) => (l.id || l._id) === contactList)?.contactCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channels:</span>
                  <span className="text-white">
                    {[enableCall && "Call", enableSMS && "SMS", enableEmail && "Email"]
                      .filter(Boolean)
                      .join(", ") || "None selected"}
                  </span>
                </div>
                {enableSMS && (
                  <div className="pt-2 border-t border-border mt-2">
                    <span className="text-muted-foreground">SMS Message:</span>
                    <p className="text-white text-xs mt-1 bg-secondary p-2 rounded">{smsMessage}</p>
                  </div>
                )}
                {enableEmail && (
                  <div className="pt-2 border-t border-border mt-2">
                    <span className="text-muted-foreground">Email Subject:</span>
                    <p className="text-white text-xs mt-1">{emailSubject}</p>
                  </div>
                )}
                {enableCall && (
                  <div className="pt-2 border-t border-border mt-2">
                    <span className="text-muted-foreground">AI Prompt:</span>
                    <p className="text-white text-xs mt-1 bg-secondary p-2 rounded">{callPrompt}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex justify-between mt-6">
        <button
          onClick={step === 1 ? onClose : handleBack}
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && (!campaignName || !contactList)) ||
              (step === 2 && !enableSMS && !enableEmail && !enableCall)
            }
            className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all"
          >
            Start Campaign 🚀
          </button>
        )}
      </div>
    </div>
    </>
  );
}

