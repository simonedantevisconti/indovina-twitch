import "../styles/legal.css";

export default function Privacy() {
  return (
    <section className="legal-page">
      <div className="container">
        <article className="legal-card">
          <p className="section-eyebrow">Informativa</p>

          <h1>Privacy Policy</h1>

          <p className="legal-card__updated">
            Ultimo aggiornamento: 5 agosto 2026
          </p>

          <section>
            <h2>1. Titolare del trattamento</h2>

            <p>
              Il titolare del trattamento dei dati raccolti attraverso Indovina
              Twitch è:
            </p>

            <p>
              <strong>[NOME O RAGIONE SOCIALE]</strong>
              <br />
              Email: <strong>[EMAIL DI CONTATTO]</strong>
            </p>
          </section>

          <section>
            <h2>2. Dati trattati</h2>

            <p>
              Il sito può trattare i dati forniti durante la registrazione, come
              nome utente, indirizzo email e immagine del profilo.
            </p>

            <p>
              Vengono inoltre registrate alcune informazioni relative alle
              partite, come vittorie, sconfitte, avversari e numero di turni.
            </p>
          </section>

          <section>
            <h2>3. Finalità del trattamento</h2>

            <p>I dati vengono utilizzati esclusivamente per:</p>

            <ul>
              <li>creare e gestire l’account dell’utente;</li>
              <li>consentire la partecipazione alle partite;</li>
              <li>salvare statistiche e storico delle partite;</li>
              <li>
                garantire sicurezza e corretto funzionamento del servizio.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Servizi utilizzati</h2>

            <p>
              Il progetto utilizza Firebase per autenticazione, database e
              protezione delle richieste tramite Firebase App Check.
            </p>

            <p>
              In caso di accesso con Google, alcune informazioni vengono
              ricevute direttamente dal relativo provider di autenticazione.
            </p>
          </section>

          <section>
            <h2>5. Conservazione dei dati</h2>

            <p>
              I dati vengono conservati per il tempo necessario a fornire il
              servizio oppure fino alla richiesta di cancellazione dell’account.
            </p>
          </section>

          <section>
            <h2>6. Diritti dell’utente</h2>

            <p>
              L’utente può chiedere accesso, modifica o cancellazione dei propri
              dati contattando il titolare all’indirizzo email indicato in
              questa pagina.
            </p>
          </section>

          <section>
            <h2>7. Modifiche alla Privacy Policy</h2>

            <p>
              Questa informativa potrà essere aggiornata in caso di modifiche al
              funzionamento del sito o ai servizi utilizzati.
            </p>
          </section>
        </article>
      </div>
    </section>
  );
}
