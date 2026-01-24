"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Link2, Copy, Check } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { WidgetLinkGenerator } from "./WidgetLinkGenerator";

const tabs = ["Widget Link", "HTML", "Shopify", "WordPress", "PrestaShop"];

const installationCode = {
  HTML: `<!-- Add this code before the closing </body> tag -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chat.Aistein.It.com/widget.js';
    script.setAttribute('data-widget-id', 'your-widget-id');
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`,
  Shopify: `1. Go to your Shopify admin
2. Navigate to Online Store > Themes
3. Click "Actions" > "Edit code"
4. Find theme.liquid file
5. Paste the code before </body>

<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chat.Aistein.It.com/widget.js';
    script.setAttribute('data-widget-id', 'your-widget-id');
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`,
  WordPress: `1. Install "Insert Headers and Footers" plugin
2. Go to Settings > Insert Headers and Footers
3. Paste this code in the "Scripts in Footer" section
4. Click "Save"

<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chat.Aistein.It.com/widget.js';
    script.setAttribute('data-widget-id', 'your-widget-id');
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`,
  PrestaShop: `1. Go to Design > Theme & Logo
2. Click "Advanced settings"
3. Click "Custom code"
4. Paste this code in the footer section

<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chat.Aistein.It.com/widget.js';
    script.setAttribute('data-widget-id', 'your-widget-id');
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`,
};

const advancedAttributes = [
  {
    name: "data-position",
    description: "Position of the widget button",
    example: 'data-position="bottom-right"',
    options: ["bottom-right", "bottom-left", "top-right", "top-left"],
  },
  {
    name: "data-language",
    description: "Default language for the chatbot",
    example: 'data-language="en"',
    options: ["en", "es", "fr", "de"],
  },
  {
    name: "data-theme",
    description: "Color theme of the widget",
    example: 'data-theme="light"',
    options: ["light", "dark", "auto"],
  },
];

export function InstallationGuide() {
  const [activeTab, setActiveTab] = useState("Widget Link");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const widgetLink = "https://chat.Aistein.It.com/widget/your-widget-id";

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(widgetLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-card p-8">
      <h2 className="text-xl font-bold text-foreground mb-6">Installation</h2>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === "Widget Link" ? (
          <WidgetLinkGenerator />
        ) : (
          <>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              {activeTab === "HTML" && (
                <>
                  <p>
                    1. Copy the code below and paste it just before the closing{" "}
                    <code className="bg-background px-2 py-0.5 rounded text-indigo-400">
                      &lt;/body&gt;
                    </code>{" "}
                    tag in your HTML
                  </p>
                  <p>
                    2. Replace{" "}
                    <code className="bg-background px-2 py-0.5 rounded text-indigo-400">
                      your-widget-id
                    </code>{" "}
                    with your actual widget ID
                  </p>
                  <p>3. Save and publish your changes</p>
                </>
              )}
              {activeTab !== "HTML" && (
                <p className="whitespace-pre-line">
                  {installationCode[activeTab as keyof typeof installationCode]
                    .split("\n\n")[0]
                    .split("\n")
                    .map((line, i) => (
                      <span key={i} className="block mb-1">
                        {line}
                      </span>
                    ))}
                </p>
              )}
            </div>

            <CodeBlock
              code={
                activeTab === "HTML"
                  ? installationCode.HTML
                  : installationCode[activeTab as keyof typeof installationCode]
                      .split("\n\n")[1]
              }
            />
          </>
        )}

        {/* Advanced attributes */}
        <div className="border-t border-border pt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-foreground hover:text-indigo-400 transition-colors"
          >
            <span className="text-sm font-medium">Advanced Attributes</span>
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {advancedAttributes.map((attr) => (
                <div key={attr.name} className="space-y-2">
                  <div>
                    <code className="text-sm text-indigo-400 bg-background px-2 py-1 rounded">
                      {attr.name}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attr.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Options: {attr.options.join(", ")}
                  </div>
                  <CodeBlock code={attr.example} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share widget link */}
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Share Widget Link
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Use this direct link to test your chatbot or share it with others
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={widgetLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-secondary-foreground outline-none"
              />
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-primary hover:brightness-110 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

