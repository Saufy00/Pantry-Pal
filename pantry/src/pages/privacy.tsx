import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="max-w-2xl prose prose-neutral dark:prose-invert">
        <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: June 30, 2026
        </p>

        <section className="space-y-4">
          <p className="text-base text-foreground/80 leading-relaxed">
            This Privacy Policy describes how we collect, use, and handle your information when you use the Pantry-Pal application.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">
            1. Information We Collect
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pantry-Pal is designed as a utility to manage household food and stock items. We only collect the information necessary to fulfill this utility:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
            <li>
              <strong>Pantry Item Data:</strong> Product names, categories, storage locations, quantities, status (e.g. in stock, low, out), estimated expiration dates, and custom notes you write.
            </li>
            <li>
              <strong>Editor Identifiers:</strong> A free-form "Updated By" name that you input when modifying items, to track who updated stock in your household.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">
            2. How Information is Stored and Processed
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All database operations are processed securely:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
            <li>
              Your data is stored in a hosted PostgreSQL database provided by **Supabase**.
            </li>
            <li>
              No cookies, tracking pixels, or third-party marketing services (such as Google Analytics or Facebook Pixel) are used on this website.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">
            3. Third-Party Services
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The application interacts with third-party APIs only when you trigger specific features:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
            <li>
              <strong>Open Food Facts API:</strong> When you scan a product barcode, the application queries Open Food Facts to automatically populate product names and categories. No personal data or user identifiers are sent during these queries.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">
            4. Your Rights
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Since we do not require account registration or store sensitive personal information like emails, password hashes, or phone numbers, all item updates or deletions are immediately executed in our live cloud database. To permanently delete any information you have input, simply use the "Delete" action on the corresponding item details view.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">
            5. Contact Information
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy or data handling, please consult the open-source repository at Saufy00/Pantry-Pal.
          </p>
        </section>
      </div>
    </Layout>
  );
}
