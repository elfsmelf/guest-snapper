import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms and Conditions | Guest Snapper",
  description: "Terms and Conditions for Guest Snapper - Read our terms of service and usage agreement.",
}

// Force static generation
export const dynamic = 'force-static'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-4">
            Welcome to Guest Snapper!
          </p>
          <p className="text-muted-foreground mb-4">
            These are the terms and conditions for:
          </p>
          <p className="font-semibold mb-4">
            https://www.guestsnapper.com
          </p>
          <p className="text-muted-foreground">
            By using the website and services, you agree to be bound by these terms and conditions and our privacy policy. In these terms and conditions, the words "website" refers to the Guest Snapper website, "we", "us", "our" and "Guest Snapper" refers to Guest Snapper, "you", "client" and "user" refers to you, the user or client of Guest Snapper.
          </p>
          <p className="text-muted-foreground mt-4">
            The following terms and conditions apply to the website and services offered by Guest Snapper. This includes the mobile and tablet versions as well as any other version of Guest Snapper accessible via desktop, mobile, tablet, social media or other devices.
          </p>
          <p className="text-muted-foreground mt-4 font-semibold">
            READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING OR OBTAINING ANY INFORMATION OR SERVICE FROM GUEST SNAPPER.
          </p>
        </div>

        {/* Terms Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. ACCEPTANCE OF TERMS</h2>
            <p className="text-muted-foreground mb-4">
              This agreement sets forth legally binding terms for your use of Guest Snapper. By using the website and services, you agree to be bound by this agreement. If you do not agree to the terms of this agreement, you must not use the website and services. We may modify this agreement from time to time, and such modification shall be effective upon posting on the website. You agree to be bound by any modifications to these terms and conditions when you use the website and the services offered on the website after such modification is posted on the website; therefore, it is important that you review this agreement regularly.
            </p>
            <p className="text-muted-foreground mb-4">
              Use of the website and services is not intended for children under the age of 13. In the case of children under the age of 18 and over the age of 13, it is the responsibility of the parent or legal guardian to determine whether use of the website and our services is appropriate for their child or ward.
            </p>
            <p className="text-muted-foreground mb-4">
              Guest Snapper may, in its sole discretion, refuse to offer the services to any user and change its eligibility criteria at any time. This provision is void where prohibited by law and the right to access the service and the website is revoked in such jurisdictions.
            </p>
            <p className="text-muted-foreground mb-4">
              The website and services may only be used in accordance with these terms and conditions and all applicable local, state and federal laws, rules and regulations.
            </p>
            <p className="text-muted-foreground">
              By using the website and services, you represent and warrant that you have the full right, power and authority to enter into this agreement and to fully perform all of your obligations hereunder. You further represent and warrant that you are under no legal disability or contractual restriction that prevents you from entering into this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. NOTIFICATIONS AND NEWSLETTER</h2>
            <p className="text-muted-foreground">
              By providing Guest Snapper with your e-mail address, you agree that we may use your e-mail address to send you important notifications and communications about our services, news and special content. If you do not wish to receive these e-mails, you may opt-out of receiving them by sending us your request through our contact information or by using the "unsubscribe" option in the e-mails themselves. This option may prevent you from receiving emails about our services, important news and special content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. ACCOUNT</h2>
            <p className="text-muted-foreground mb-4">
              By accessing our services and purchasing a package, users will be able to register and open an account on our website. When registering on the website, the user must choose a password and may be asked for additional information such as email address. You are responsible for maintaining the confidentiality of your password and account information, and are fully responsible for all activities that occur under your password or account. You agree to (a) immediately notify Guest Snapper of any unauthorized use of your password or account or any other breach of security, and (b) ensure that you log out of your account at the end of each session. You may never use another user's account without Guest Snapper's prior authorization. Guest Snapper will not be liable for any loss or damage arising from your breach of this agreement.
            </p>
            <p className="text-muted-foreground mb-4">
              Users may cancel their accounts at any time and for any reason by sending us their request through our contact information. Such cancellation will only result in the deletion of the account and the deletion of all personal data provided to Guest Snapper.
            </p>
            <p className="text-muted-foreground">
              Guest Snapper reserves the right to terminate your account or your access immediately, with or without notice, and without liability to you, if Guest Snapper believes that you have violated any of these terms or have provided Guest Snapper with false or misleading information when placing an order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. SERVICES AND PACKAGES</h2>
            <p className="text-muted-foreground mb-4">
              Guest Snapper offers packages and services for event photo sharing. Features and package details are displayed on our website at the time of purchase. Please check the features of each package before placing your order.
            </p>
            <p className="text-muted-foreground mb-4">
              When purchasing a package, customers will be able to customize their event page and configure settings according to the options available on our website. Specific features, access duration, storage limits, and other package details are provided during the purchase process.
            </p>
            <p className="text-muted-foreground">
              Guest Snapper may change or discontinue the availability of services at any time at its sole discretion. All new orders are considered separately and each is treated individually.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. PAYMENTS</h2>
            <p className="text-muted-foreground mb-4">
              Packages can be paid by the following payment methods:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Credit/debit card (Visa, Mastercard, Discover, Amex, Diners, etc.)</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              When you make the purchase of a package, Guest Snapper will send you a confirmation email. This confirmation email will be produced automatically so that you have confirmation of the payment of the package. This confirmation email will also contain the electronic receipt of the transaction. If you do not receive the package purchase confirmation email, it may have been sent to your junk or spam folder.
            </p>
            <p className="text-muted-foreground mb-4">
              If you find any inconsistencies in your billing, please contact us via our contact details or you can make a complaint via the client service of the relevant payment processor.
            </p>
            <p className="text-muted-foreground mb-4">
              If your card is declined, you will receive an error message and no payment will be charged to your card. There may be a pending transaction on your account until your card issuing bank withdraws the authorization. This usually takes 2 to 5 business days. Your card may be declined for a number of reasons, such as insufficient funds, AVS (Address Verification System) mismatch or you have entered an incorrect security code.
            </p>
            <p className="text-muted-foreground mb-4">
              If your payment is declined, you will need to provide another card on which the payment can be charged and processed.
            </p>
            <p className="text-muted-foreground">
              Your payment details will be processed and stored securely and for the sole purpose of processing the purchase of packages. Guest Snapper reserves the right to hire any payment processor available on the market, which treats your data for the sole purpose of processing the purchase of packages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. ACCESS AND USAGE</h2>
            <p className="text-muted-foreground mb-4">
              Access to the event page and the ability to share photos will be provided according to the package purchased. Clients can share access with their event guests as specified in their package terms.
            </p>
            <p className="text-muted-foreground mb-4">
              Clients and guests can upload photos to the event page according to the limits specified in their package. Please note that only photos of the corresponding event are allowed to be uploaded. It is not allowed to upload different images that are not related to the event. It is the responsibility of the client to inform the guests about the correct use of the website.
            </p>
            <p className="text-muted-foreground">
              The event page and all photos uploaded by users and guests will have a duration as specified in the package purchased. Access duration begins from the event date specified by the client. At the end of this period, the event page and its content may be deleted according to the terms of the purchased package.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. CONTENT AND INTELLECTUAL PROPERTY</h2>
            <p className="text-muted-foreground mb-4">
              Users retain ownership of the photos and content they upload to Guest Snapper. By uploading content to our service, you grant Guest Snapper a limited, non-exclusive license to host, store, and display your content for the purpose of providing our services to you.
            </p>
            <p className="text-muted-foreground mb-4">
              You represent and warrant that you have all necessary rights to upload and share the content you provide, and that such content does not violate any third-party rights or applicable laws.
            </p>
            <p className="text-muted-foreground">
              Guest Snapper respects intellectual property rights and expects users to do the same. You may not upload content that infringes on others' copyrights, trademarks, or other intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. DISCLAIMER</h2>
            <p className="text-muted-foreground">
              By accessing the website and the content available on the website, you accept personal responsibility for the results of using the information available on the content. You agree that Guest Snapper has not guaranteed the results of any actions taken, whether or not advised by this website or the content. Guest Snapper provides resources and content for informational purposes only. We do not guarantee that the information available on the website is accurate, complete or updated. The content of this website is provided for general information and should not be taken as professional advice. Any use of the material provided on this website is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. COPYRIGHT</h2>
            <p className="text-muted-foreground">
              All materials on the website, including, without limitation, names, logos, trademarks, images, text, columns, graphics, videos, photographs, illustrations, software and other elements are protected by copyrights, trademarks and/or other intellectual property rights owned and controlled by Guest Snapper or by third parties that have licensed or otherwise provided their material to the website. You acknowledge and agree that all materials on Guest Snapper are made available for limited, non-commercial, personal use only. Except as specifically provided herein, no material may be copied, reproduced, republished, sold, downloaded, posted, transmitted, or distributed in any way, or otherwise used for any purpose, by any person or entity, without Guest Snapper's prior express written permission. You may not add, delete, distort, or otherwise modify the material. Any unauthorized attempt to modify any material, to defeat or circumvent any security features, or to utilize Guest Snapper or any part of the material for any purpose other than its intended purposes is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. COPYRIGHT INFRINGEMENT</h2>
            <p className="text-muted-foreground mb-4">
              Guest Snapper will respond to all inquiries, complaints and claims regarding alleged infringement for failure to comply with or violation of the provisions contained in the Digital Millennium Copyright Act (DMCA). Guest Snapper respects the intellectual property of others, and expects users to do the same. If you believe, in good faith, that any material provided on or in connection with the website infringes your copyright or other intellectual property right, please send us your copyright infringement request pursuant to Section 512 of the Digital Millennium Copyright Act (DMCA), via our contact information, with the following information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Identification of the intellectual property right that is allegedly infringed. All relevant registration numbers or a statement regarding ownership of the work should be included.</li>
              <li>A statement that specifically identifies the location of the infringing material, in sufficient detail so that Guest Snapper can find it on the website.</li>
              <li>Your name, address, telephone number and email address.</li>
              <li>A statement by you that you have a good faith belief that the use of the allegedly infringing material is not authorized by the copyright owner, or its agents, or by law.</li>
              <li>A statement by you, made under penalty of perjury, that the information in your notification is accurate, and that you are the copyright owner or authorized to act on its behalf.</li>
              <li>An electronic or physical signature of the copyright owner or of the person authorized to act on the copyright owner's behalf.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. CONFIDENTIAL INFORMATION</h2>
            <p className="text-muted-foreground">
              Information provided by our clients through our services will be treated as confidential information and will be used solely for the purpose of providing our services properly. Guest Snapper will protect such confidential information from disclosure to third parties by employing the same degree of care used to protect its own confidentiality or proprietary information of similar importance. If necessary to carry out a prospective business relationship, Guest Snapper may disclose confidential information received pursuant to our services to employees and/or consultants with a need to know, provided that the consultants are obligated to protect such confidential information from unauthorized use and disclosure. Confidential information shall not be disclosed to any third party without the prior written consent of the client who is the owner of the information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. PERSONAL DATA</h2>
            <p className="text-muted-foreground">
              Any personal information you submit in connection with the services and use of the website will be used in accordance with our privacy policy. By using the services, you agree that we may collect and store your personal information. Please see our privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. PROHIBITED ACTIVITIES</h2>
            <p className="text-muted-foreground mb-4">
              The content and information available on the website (including, but not limited to, data, information, text, music, sound, photos, graphics, video, maps, icons or other material), as well as the infrastructure used to provide such content and information, is proprietary to Guest Snapper or licensed to Guest Snapper by third parties. For all content other than your content, you agree not to otherwise modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell or re-sell any information, software or services obtained from or through the website. In addition, the following activities are prohibited:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Access, monitor, reproduce, distribute, transmit, broadcast, display, sell, license, copy or otherwise exploit any content of the services, including but not limited to, using any robot, spider, scraper or other automated means or any manual process for any purpose not in accordance with this agreement or without our express written permission.</li>
              <li>Violate the restrictions in any robot exclusion headers on the services or bypass or circumvent other measures employed to prevent or limit access to the services.</li>
              <li>Take any action that imposes, or may impose, in our discretion, an unreasonable or disproportionately large load on our infrastructure.</li>
              <li>Deep-link to any portion of the services for any purpose without our express written permission.</li>
              <li>"Frame", "mirror" or otherwise incorporate any part of the website into any other websites or service without our prior written authorization.</li>
              <li>Attempt to modify, translate, adapt, edit, decompile, disassemble, or reverse engineer any software programs used by Guest Snapper.</li>
              <li>Circumvent, disable or otherwise interfere with security-related features of the website or features that prevent or restrict use or copying of any content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. DISCLAIMER OF WARRANTIES</h2>
            <p className="text-muted-foreground mb-4">
              Because of the nature of the Internet, Guest Snapper provides and maintains the website on an "as is", "as available" basis and makes no promise that use of the website will be uninterrupted or entirely error free. We are not responsible to you if we are unable to provide our Internet services for any reason beyond our control.
            </p>
            <p className="text-muted-foreground mb-4">
              Our website may from time to time contain links to other websites which are not under the control of and are not maintained by us. These links are provided for your convenience only and we are not responsible for the content of those sites.
            </p>
            <p className="text-muted-foreground mb-4">
              Except as provided above we can give no other warranties, conditions or other terms, express or implied, statutory or otherwise and all such terms are hereby excluded to the maximum extent permitted by law.
            </p>
            <p className="text-muted-foreground mb-4">
              You will be responsible for any breach of these terms by you and if you use the website in breach of these terms you will be liable to and will reimburse Guest Snapper for any loss or damage caused as a result.
            </p>
            <p className="text-muted-foreground mb-4">
              Guest Snapper shall not be liable in any amount for any failure to perform any obligation under this agreement if such failure is caused by the occurrence of any unforeseen event beyond its reasonable control, including, without limitation, Internet outages, communications outages, fire, flood, war or any uncontrollable act of nature.
            </p>
            <p className="text-muted-foreground mb-4">
              These terms do not affect your statutory rights as a consumer which are available to you.
            </p>
            <p className="text-muted-foreground mb-4">
              Subject as aforesaid, to the maximum extent permitted by law, Guest Snapper excludes liability for any loss or damage of any kind howsoever arising, including without limitation any direct, indirect or consequential loss whether or not such arises out of any problem you notify to Guest Snapper and Guest Snapper shall have no liability to pay any money by way of compensation, including without limitation all liability in relation to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Any incorrect or inaccurate information on the website.</li>
              <li>The infringement by any person of any Intellectual Property Rights of any third party caused by their use of the website or service purchased through the website.</li>
              <li>Any loss or damage resulting from your use or the inability to use the website or resulting from unauthorized access to, or alteration of your transmissions or data in circumstances which are beyond our control.</li>
              <li>Any loss of profit, wasted expenditure, corruption or destruction of data or any other loss which does not directly result from something we have done wrong.</li>
              <li>Any amount or kind of loss or damage due to viruses or other malicious software that may infect a user's computer equipment, software, data or other property caused by persons accessing or using content from the website or from transmissions via emails or attachments received from Guest Snapper.</li>
              <li>All representations, warranties, conditions and other terms which but for this notice would have effect.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">15. INDEMNIFICATION</h2>
            <p className="text-muted-foreground mb-4">
              You agree to defend and indemnify Guest Snapper from and against any claims, causes of action, demands, recoveries, losses, damages, fines, penalties or other costs or expenses of any kind or nature including but not limited to reasonable legal and accounting fees, brought by third parties as a result of:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Your breach of this agreement or the documents referenced herein.</li>
              <li>Your violation of any law or the rights of a third party.</li>
              <li>Your use of the services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">16. CHANGES AND TERMINATION</h2>
            <p className="text-muted-foreground">
              We may modify the website and these terms at any time, at our sole discretion and without notice. You are responsible for keeping yourself informed of these terms. Your continued use of the website constitutes your acceptance of any changes to these terms and any changes will supersede all previous versions of the terms. Unless otherwise specified, all changes to these terms apply to all users and clients. In addition, we may terminate our agreement with you under these terms at any time by notifying you in writing (including by email) or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">17. NO PARTNERSHIP</h2>
            <p className="text-muted-foreground">
              You agree that no joint venture, partnership, employment, or agency relationship exists between you and Guest Snapper as a result of these terms or your use of the services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">18. INTEGRATION CLAUSE</h2>
            <p className="text-muted-foreground">
              This agreement together with the privacy policy and any other legal notices published by Guest Snapper, shall constitute the entire agreement between you and Guest Snapper concerning and governs your use of the website and the services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">19. DISPUTES</h2>
            <p className="text-muted-foreground mb-4">
              The user agrees that any dispute, claim or controversy arising out of or relating to these terms and conditions, or the breach, termination, enforcement, interpretation or validity thereof or the use of the services, shall be resolved by binding arbitration between the user and Guest Snapper, provided that each party retains the right to bring an individual action in a court of competent jurisdiction.
            </p>
            <p className="text-muted-foreground mb-4">
              In the event of a dispute arising in connection with the use of the services or the breach of these conditions, the parties agree to submit their dispute to arbitration resolution before a reputable arbitration organization as mutually agreed by the parties and in accordance with applicable commercial arbitration rules.
            </p>
            <p className="text-muted-foreground mb-4">
              To the fullest extent permitted by law, you agree that you will not file, join or participate in any class action lawsuit in connection with any claim, dispute or controversy that may arise in connection with your use of the website and services.
            </p>
            <p className="text-muted-foreground">
              The courts of the United States, specifically the courts located in the State of California, shall have jurisdiction over any dispute, controversy or claim relating to Guest Snapper and its business operations. Any such dispute or controversy shall be brought and resolved in the courts of the United States, specifically the courts located in the State of California.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">20. FINAL PROVISIONS</h2>
            <p className="text-muted-foreground mb-4">
              These terms and conditions are governed by the laws of the United States. Use of the website and services are not authorized in any jurisdiction that does not give effect to all of the provisions of these terms.
            </p>
            <p className="text-muted-foreground mb-4">
              Our performance of these terms is subject to existing laws and legal process, and nothing contained in these terms limits our right to comply with law enforcement or other governmental or legal requests or requirements relating to your use of our website or information provided to or gathered by us with respect to such use.
            </p>
            <p className="text-muted-foreground">
              If any part of these terms is found to be invalid, illegal or unenforceable, the validity, legality and enforceability of the remaining provisions will not in any way be affected or impaired. Our failure or delay in enforcing any provision of these terms at any time does not waive our right to enforce the same or any other provision(s) hereof in the future.
            </p>
            <p className="text-muted-foreground mt-4">
              Any rights not expressly granted herein are reserved.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">21. CONTACT INFORMATION</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions or concerns about these terms, please contact us through our contact forms or by using the contact information below:
            </p>
            <p className="font-semibold mb-2">Guest Snapper</p>
            <p className="text-muted-foreground">
              Email:{" "}
              <a href="mailto:support@guestsnapper.com" className="text-primary hover:underline">
                support@guestsnapper.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
