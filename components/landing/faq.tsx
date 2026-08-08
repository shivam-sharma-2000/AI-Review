import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Do customers need to install an app?",
    answer:
      "No. Scanning the QR code opens a normal web page in their phone's browser. There's nothing to download or sign in to.",
  },
  {
    question: "Can customers edit the AI-generated review?",
    answer:
      "Yes — always. The draft appears in an editable text box, and customers can change as much or as little as they like before posting it to Google.",
  },
  {
    question: "Will the AI make up details that aren't true?",
    answer:
      "No. The review is generated strictly from the customer's own rating, what they said they liked, and any additional comments they typed in. It doesn't invent facts or exaggerate claims.",
  },
  {
    question: "What languages are supported?",
    answer:
      "Customers can currently write their review in English, Hindi, Gujarati, or Marathi, with more languages planned.",
  },
  {
    question: "Does ReviewPilot post reviews on the customer's behalf?",
    answer:
      "No. ReviewPilot only prepares a draft. The customer reviews it, edits it if they want, and then chooses to post it on Google themselves.",
  },
  {
    question: "Can I download the QR code for print?",
    answer:
      "Yes. Every business gets a QR code that can be downloaded as a high-resolution PNG or a scalable SVG, ready for table tents, receipts, or packaging.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12 w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
