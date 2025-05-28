
import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Termini di Servizio</h1>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">1. Accettazione dei Termini</h2>
          <p className="text-gray-700 mb-4">
            Utilizzando Meta Muse, accetti i presenti termini di servizio. Ti preghiamo di leggerli attentamente.
          </p>

          <h2 className="text-xl font-semibold mb-4">2. Descrizione del Servizio</h2>
          <p className="text-gray-700 mb-4">
            Meta Muse fornisce strumenti di analisi SEO e ottimizzazione del sito web. Ci riserviamo il diritto di modificare o interrompere il servizio in qualsiasi momento.
          </p>

          <h2 className="text-xl font-semibold mb-4">3. Account Utente</h2>
          <p className="text-gray-700 mb-4">
            Sei responsabile del mantenimento della riservatezza del tuo account e di tutte le attività che si verificano sotto il tuo account.
          </p>

          <h2 className="text-xl font-semibold mb-4">4. Limitazioni d'Uso</h2>
          <p className="text-gray-700 mb-4">
            Non è consentito utilizzare il servizio per scopi illegali o non autorizzati. Meta Muse si riserva il diritto di terminare gli account che violano questi termini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
