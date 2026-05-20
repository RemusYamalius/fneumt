# Plan: synchronisation des cartes & vérification d'adhésion par les comptes suprêmes

## 1. Origine de l'écart 77 vs 69

Dans la carte « قاعدة البيانات » (`DatabaseDashboard.tsx`) → `supabase.from('profiles').select('*')` ramène **tous** les profils du périmètre.

Dans la carte « التحقق من الانخراط » (`MembershipVerification.tsx`, lignes 89–113) la requête applique deux exclusions supplémentaires :
- `.neq('user_id', user.id)` — exclut le compte connecté.
- Filtrage côté client : tous les `user_id` dont le rôle ≠ `teacher` sont retirés (responsables, adjoints, etc.).

L'écart de 8 = 1 (soi-même) + 7 (membres promus du même périmètre).

## 2. Correctifs

### A. Aligner les deux cartes sur le même ensemble
Dans `MembershipVerification.tsx > fetchUsers()` :
- Retirer le `.neq('user_id', user!.id)`.
- Supprimer le filtre `promotedUserIds` (les comptes promus peuvent aussi cotiser et donc avoir un badge à vérifier).
- Conserver le périmètre académie/direction.

Résultat : le tableau de vérification affiche les mêmes profils que la base de données pour le même périmètre → compteurs identiques.

Côté UX : pour la ligne de l'utilisateur connecté, désactiver les boutons d'action (on ne vérifie pas son propre badge).

### B. Autoriser admin / SG / SG adjoint à vérifier l'adhésion

Aujourd'hui :
- La page n'est ouverte qu'aux `deputy_local_*` et aux comptes suprêmes (`isDeputyLocal || isAdminLike`), mais pour un admin sans `academy`/`directorate`, `fetchUsers` ne tourne jamais.
- Côté base : seule la policy `Deputies can update membership status` (via `is_same_area_deputy`) autorise l'update → les comptes suprêmes sont bloqués par RLS même s'ils cliquent.

Changements :

**Base de données (migration)**
```sql
CREATE POLICY "Supreme accounts can update membership"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );
```
(Les policies existantes sont conservées : enseignants/adjoints/coordinateurs continuent de fonctionner.)

**Front (`MembershipVerification.tsx`)**
- Détecter le rôle « suprême » via `useAuth().role`.
- Pour ces rôles : utiliser le filtre hiérarchique existant (`useHierarchicalFilter`) pour choisir académie + direction, sans bloquer sur `profile.academy`/`profile.directorate`.
- Si aucune académie/direction n'est encore choisie par un compte suprême, afficher un message « Sélectionnez une académie et une direction » au lieu du loader infini.
- Le bouton « Vérifier » reste actif pour eux (la RLS ajoutée autorise l'update).

## 3. Fichiers touchés
- `src/pages/MembershipVerification.tsx` (logique de fetch + UX self/suprêmes)
- Nouvelle migration SQL pour la policy `profiles` UPDATE comptes suprêmes

## 4. Hors périmètre
- Aucun changement visuel/design global, ni autres pages, ni autres rôles.
- Pas de changement au DatabaseDashboard (il sert déjà de référence).
