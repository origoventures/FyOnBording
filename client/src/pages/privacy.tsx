
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Informativa sulla Privacy</h1>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">1. Raccolta dei Dati</h2>
          <p className="text-gray-700 mb-4">
            Raccogliamo informazioni necessarie per fornire i nostri servizi, inclusi dati di utilizzo e informazioni fornite durante la registrazione.
          </p>

          <h2 className="text-xl font-semibold mb-4">2. Utilizzo dei Dati</h2>
          <p className="text-gray-700 mb-4">
            Utilizziamo i dati raccolti per fornire, mantenere e migliorare i nostri servizi, nonché per comunicare con gli utenti riguardo al loro account.
          </p>

          <h2 className="text-xl font-semibold mb-4">3. Protezione dei Dati</h2>
          <p className="text-gray-700 mb-4">
            Adottiamo misure di sicurezza per proteggere i tuoi dati personali. I dati sono crittografati e archiviati in modo sicuro.
          </p>

          <h2 className="text-xl font-semibold mb-4">4. Cookie</h2>
          <p className="text-gray-700 mb-4">
            Utilizziamo i cookie per migliorare l'esperienza utente e analizzare l'utilizzo del sito.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
