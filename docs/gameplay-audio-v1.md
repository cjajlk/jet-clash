# Sons gameplay V1

Deux effets originaux sont synthétisés localement avec Web Audio, sans fichier externe ni téléchargement :
- Tir : impact grave et claquement énergétique court ; sa couleur varie selon la puissance réelle de la frappe.
- But : impact grave suivi d’une courte montée mélodique arcade ; tonalité plus basse pour le but de Heavy.

Le tir se déclenche au moment de l’impulsion appliquée, y compris la frappe différée sous pression. Une charge ou un relâchement sans contact ne déclenche aucun son. Le flip déclenche le son uniquement au premier impact effectif. Le but se déclenche après validation du but, en duel et en entraînement ; un but refusé ne sonne pas.

Le son s’active après une interaction clavier ou tactile/souris, conformément aux règles du navigateur. Aucun événement antérieur n’est rejoué lorsque le navigateur autorise le son. Le jeu continue normalement si l’API audio est indisponible ou bloquée. Un seul contexte audio est utilisé ; les sources se déconnectent en fin de son. La pause et la coupure du son arrêtent les sources actives.

Le bouton SONS dans les Options active/coupe les deux effets et conserve le choix dans settings.sound du profil existant. Les autres réglages et la progression restent intacts. Le volume global est modéré et les WAV de prévisualisation proviennent exactement de la même synthèse que le jeu.

Tests : gameplay-audio.test.mjs (buts acceptés/refusés, entraînement, tirs immédiats/différés, absence de son de charge, flip unique, absence de panne gameplay si l’audio échoue, API indisponible, pause et coupure). gameplay-audio-browser.cjs vérifie le contexte audio réel, les déclenchements, le bouton, le rechargement et la pause sous Edge, sur 1280×720, 390×844 et 844×390. AUDIO_OUTPUT_DIR permet de produire les deux aperçus WAV et de vérifier un signal non nul sans écrêtage.

Validation finale : 246 tests unitaires réussis, aucun échec. Parcours navigateur audio, régressions de contrôle et défis réussis. Aperçus rendus à 44,1 kHz : pic tir 0,109 ; pic but 0,082 ; aucun écrêtage.
