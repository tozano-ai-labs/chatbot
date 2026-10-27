# <nom du projet>

<Une phrase : ce que fait ce projet, pour qui.>

<!--
Fichier à personnaliser puis committé dans le projet. Ce qu'il y a en dessous sert de
socle commun à tous les projets dont l'IA intervient comme exécutant : règles de
travail, rôles d'agents, stratégie de tests et points RGPD à vérifier.

Ce fichier est prioritaire sur .ai-template/AGENTS.md. Une règle propre au projet
prime ici ; pour revenir à la règle commune, retirer la ligne concernée.
-->

## Règles propres au projet

- Commandes : `npm test`, `npm run lint`, `npm run dev`.
- Langue de la documentation et des messages d'interface : français.
- Les messages de commit sont en anglais, format gitmoji + type(scope) — voir
  `.ai-template/docs/commits.md`.

## Documentation du template

À lire selon le besoin, pas d'avance :

- `.ai-template/docs/conventions.md` — style de code et dépendances.
- `.ai-template/docs/commits.md` — format de commit et périmètre de l'agent.
- `.ai-template/docs/qualite.md` — Definition of Done, seuils, intégration continue.
- `.ai-template/docs/tests/README.md` — stratégie de tests, seuils de couverture.
- `.ai-template/docs/securite-ia.md` — risques propres aux systèmes IA.
- `.ai-template/docs/rgpd/README.md` — méthode d'audit RGPD.
- `.ai-template/docs/rgpd/CHECKLIST.md` — les 84 points à vérifier.

## Règles qui ne se négocient pas

1. Aucun changement livré sans test exécuté.
2. Aucun secret en clair, jamais de prompt journalisé en contenant une donnée
   personnelle.
3. Les commits passent par l'agent `committer` : gitmoji, type, scope d'étape de
   développement, description en anglais.
4. Le push est fait à la main, après test. L'agent ne pousse jamais.
5. RGPD : les items bloquants non conformes sont signalés avant livraison, sans
   bloquer.

## État du template

Sous-module `ai-template`, version attendue `<vX.Y.Z>`, déclarée dans
`ai-template.json`. Mettre à jour :

```bash
git -C .ai-template fetch --tags
git -C .ai-template checkout <vX.Y.Z>
git add .ai-template && git commit
```

## État RGPD

Dernier audit : `<AAAA-MM-JJ>` — voir `docs/rgpd/etat.yml`.
Non applicable à ce projet ? Écrire pourquoi ici, et l'explication vaut justification.