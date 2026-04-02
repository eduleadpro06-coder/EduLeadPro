import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Eye, FileText, Database, Share2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0 mr-2">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              EduLeadPro
            </span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="hidden sm:inline-flex">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* Title Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
            <Lock className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your privacy is critically important to us. This policy outlines how we collect, use, and protect your personal and institutional information.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 font-medium bg-white border rounded-full px-4 py-1.5 w-max mx-auto shadow-sm">
            <FileText className="w-4 h-4" />
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Policy Content Blocks */}
        <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-10 space-y-12">

          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Eye className="w-6 h-6 text-blue-500" />
              1. Information We Collect
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>
                We collect information to provide better services to our users (schools, educational institutions, students, and parents). The types of information we require may include:
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li><strong className="text-slate-800">Account Information:</strong> Name, email address, phone number, and institutional details when registering.</li>
                <li><strong className="text-slate-800">Device Permissions:</strong> Our mobile applications may require access to your device's <strong>Camera</strong> (e.g., for Gate Scanner features) or <strong>Storage</strong> (to upload profile images or documents). We only request permissions essential for features to function.</li>
                <li><strong className="text-slate-800">Usage Data:</strong> Information about how you interact with our web applications and mobile apps, including IP addresses, browser types, and access times.</li>
              </ul>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-green-500" />
              2. How We Use and Store Your Data
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>The information we collect is used in the following ways:</p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li>To provide, maintain, and improve EduLeadPro's core administrative and academic tracking services.</li>
                <li>To process transactions related to school fees or event ticketing.</li>
                <li>To maintain the physical security of institutions via our Gate check-in/check-out logs (processing temporary visitor images or IDs).</li>
                <li>To send periodic necessary communications regarding your account or updates to our platform.</li>
              </ul>
              <p className="mt-4">
                We implement robust encryption and security protocols (including SSL/TLS) to prevent unauthorized access, disclosure, or modification of your data.
              </p>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Share2 className="w-6 h-6 text-purple-500" />
              3. Data Sharing and Third Parties
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>
                We <strong>do not sell, trade, or rent</strong> your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners and trusted affiliates.
              </p>
              <p className="mt-4">
                We may use third-party service providers (such as cloud hosting, payment gateways, and SMS/Email dispatchers) to help us operate our business. These third parties only have access to information necessary to perform their specialized tasks on our behalf.
              </p>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              4. Mobile App Specific Policies
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>
                For users of our Android or iOS mobile applications:
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li><strong>Camera/Photo Library:</strong> We may request camera access specifically for scanning QR codes (gate management) or capturing relevant educational documents. Images are temporarily processed or securely uploaded to our cloud servers and are not shared publicly.</li>
                <li><strong>Location Services:</strong> We may collect general location data if enabled, primarily to power specific features like verifying attendance within geofences. This is explicitly requested in-app.</li>
              </ul>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              5. Your Rights & Contact Information
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>
                Depending on your local jurisdiction, you have the right to request access to, correction, or deletion of your personal data stored on our platform. Since EduLeadPro acts primarily as a data processor for the Educational Institutions using our software, data deletion requests may need to be approved by your affiliated institution.
              </p>
              <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-800 mb-2">Have questions about this policy?</p>
                <p>
                  Please contact us at: <br/>
                  <a href="mailto:privacy@eduleadpro.com" className="text-primary hover:underline font-medium">privacy@eduleadpro.com</a>
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer minimal */}
      <footer className="bg-white border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} EduLeadPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
