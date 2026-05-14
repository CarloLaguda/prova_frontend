/**
 * EMAIL DI TEST — SafeClaim
 *
 * In fase di sviluppo le email sono hardcodate qui.
 * Quando il backend esporrà GET /utente/:id, GET /assicuratori, GET /officine/:id,
 * basterà sostituire questi valori con chiamate HTTP nel EmailService.
 */
export const TEST_EMAILS = {
  automobilista: 'papagni.gabriele@iisgalvanimi.edu.it',
  assicuratore:  'papagni.gabriele@iisgalvanimi.edu.it',
  perito:        'papagni.gabriele@iisgalvanimi.edu.it',
  officina:      'papagni.gabriele@iisgalvanimi.edu.it',
  soccorso:      'papagni.gabriele@iisgalvanimi.edu.it',
} as const;