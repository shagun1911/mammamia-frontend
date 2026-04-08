'use client';

import { Card } from '@/components/ui/card';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

export default function ConnectInstagramDocs() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Connect Instagram Messaging</h1>
          <p className="text-muted-foreground">
            Step-by-step guide to get your Meta Graph API credentials for Instagram DMs
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Prerequisites</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Instagram Business or Creator Account (not personal)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Facebook Page linked to your Instagram account</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Meta Business Account (verified)</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Step 1: Create Meta App</h2>
          <ol className="space-y-4 text-sm list-decimal list-inside">
            <li>
              Go to <a href="https://developers.facebook.com/apps/" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
                Meta for Developers <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Click <strong>"Create App"</strong></li>
            <li>Select <strong>"Business"</strong> as app type</li>
            <li>Fill in app details:
              <ul className="ml-6 mt-2 space-y-1 list-disc">
                <li>App Name: Your company name</li>
                <li>Contact Email: Your email</li>
                <li>Business Account: Select your Meta Business Account</li>
              </ul>
            </li>
            <li>Click <strong>"Create App"</strong></li>
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🔧 Step 2: Configure Instagram API</h2>
          <ol className="space-y-4 text-sm list-decimal list-inside">
            <li>In your app dashboard, find <strong>"Instagram"</strong> product</li>
            <li>Click <strong>"Set Up"</strong></li>
            <li>Add the <strong>"Instagram Messaging API"</strong></li>
            <li>Generate a User Access Token:
              <ul className="ml-6 mt-2 space-y-1 list-disc">
                <li>Go to <strong>Tools → Graph API Explorer</strong></li>
                <li>Select your app</li>
                <li>Add permissions: <code className="bg-muted px-1 py-0.5 rounded">instagram_business_basic</code>, <code className="bg-muted px-1 py-0.5 rounded">instagram_business_manage_messages</code>, <code className="bg-muted px-1 py-0.5 rounded">instagram_business_manage_comments</code>, <code className="bg-muted px-1 py-0.5 rounded">pages_show_list</code>, <code className="bg-muted px-1 py-0.5 rounded">pages_messaging</code></li>
                <li>Click <strong>"Generate Access Token"</strong></li>
                <li>Log in and authorize</li>
              </ul>
            </li>
            <li>Copy the <strong>Access Token</strong> (starts with EAAA...)</li>
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🔑 Step 3: Get Your Credentials</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Meta App ID:</h3>
              <p>Go to <strong>App Settings → Basic</strong>, copy <strong>"App ID"</strong></p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Meta App Secret:</h3>
              <p>In the same page, copy <strong>"App Secret"</strong> (click "Show")</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Instagram Business Account ID:</h3>
              <ol className="ml-6 mt-2 space-y-1 list-decimal">
                <li>Go to <strong>Meta Business Suite → Settings</strong></li>
                <li>Click <strong>"Instagram Accounts"</strong></li>
                <li>Find your account and copy the numeric ID</li>
              </ol>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🪝 Step 4: Set Up Webhooks</h2>
          <ol className="space-y-4 text-sm list-decimal list-inside">
            <li>In your Meta App, go to <strong>Instagram → Webhooks</strong></li>
            <li>Subscribe to <strong>messages</strong> webhook field</li>
            <li>Add Callback URL: <code className="bg-muted px-2 py-1 rounded text-xs">https://yourdomain.com/api/v1/webhooks/360dialog</code></li>
            <li>Add Verify Token: Use the token from your backend env</li>
            <li>Click <strong>"Verify and Save"</strong></li>
          </ol>
        </Card>

        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h2 className="text-xl font-semibold mb-4">⚠️ Important Notes</h2>
          <ul className="space-y-2 text-sm">
            <li>• Access tokens expire. Use a <strong>long-lived token</strong> (60 days)</li>
            <li>• For production, submit your app for <strong>App Review</strong></li>
            <li>• Test with your own account before going live</li>
            <li>• Rate limits apply: 200 API calls per hour per user</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">✅ Final Step: Enter in Settings</h2>
          <p className="text-sm mb-4">
            Once you have all credentials, go to your <strong>Settings → Socials</strong> page and enter:
          </p>
          <ul className="space-y-1 text-sm list-disc list-inside ml-4">
            <li>Meta Access Token</li>
            <li>Meta App ID</li>
            <li>Meta App Secret</li>
            <li>Instagram Business Account ID</li>
          </ul>
          <p className="text-sm mt-4 text-muted-foreground">
            Click "Save & Connect" to test the connection!
          </p>
        </Card>

        <div className="flex gap-4">
          <a
            href="https://developers.facebook.com/docs/instagram-api/guides/messaging"
            target="_blank"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Official Instagram Messaging API Docs <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

