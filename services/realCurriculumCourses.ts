// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 RÉFÉRENTIEL DES COURS RÉELS & OFFICIELS — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Contenus académiques complets, exhaustifs et vérifiés pour les programmes
// nationaux (Guinée, Sénégal, France, Côte d'Ivoire, etc.) et pré-universitaires.
// Rédigés selon la pédagogie d'excellence du Professeur Diallo.

import { Course, Lesson, QuizQuestion } from '../types';

export interface RealSubjectCourse {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterTitle: string;
    levelName: string;
    description: string;
    lessons: Lesson[];
    practicalExercise: {
        title: string;
        context: string;
        problemStatement: string;
        guidedSteps: string[];
        detailedSolution: string;
    };
    quizQuestions: QuizQuestion[];
    officialResources: {
        title: string;
        type: 'Fiche Synthèse' | 'Annales Corrigées' | 'Manuel Officiel' | 'Formulaire';
        description: string;
    }[];
}

export const REAL_ACADEMIC_COURSES_REGISTRY: Record<string, RealSubjectCourse> = {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. MATHÉMATIQUES TERMINALE : LIMITES, CONTINUITÉ & ASYMPTOTES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    'math-sm-lim-cont': {
        subjectId: 'gn-sm-maths',
        subjectName: 'Mathématiques Approfondies',
        chapterId: 'gn-ch-math-1',
        chapterTitle: 'Limites, Continuité et Dérivation des Fonctions',
        levelName: 'Terminale Sciences Mathématiques / S',
        description: 'Étude rigoureuse des comportements asymptotiques, levée des formes indéterminées et théorèmes de continuité.',
        lessons: [
            {
                id: 'math-sm-l1',
                title: '1. Définition Formelle des Limites et Levée des Formes Indéterminées',
                duration: '2h15',
                completed: false,
                isLocked: false,
                content: `### Chapitre 1 : Limites et Comportements Asymptotiques

#### 1. Définition Rigoureuse de la Limite
Soit $f$ une fonction définie sur un intervalle $I$ contenant un point $x_0$ (ou dont $x_0$ est une borne).

* **Limite Finie en un point** : On dit que $\\lim_{x \\to x_0} f(x) = L \\in \\mathbb{R}$ si et seulement si :
$$\\forall \\varepsilon > 0, \\, \\exists \\delta > 0, \\, \\forall x \\in I, \\, (|x - x_0| < \\delta \\implies |f(x) - L| < \\varepsilon)$$

* **Limite Infinie en $+\\infty$** : On dit que $\\lim_{x \\to +\\infty} f(x) = +\\infty$ si et seulement si :
$$\\forall M > 0, \\, \\exists A > 0, \\, \\forall x \\in I, \\, (x > A \\implies f(x) > M)$$

---

#### 2. Les 4 Formes Indéterminées Fondamentales & Méthodes de Résolution
En analyse réelle, les quatre formes indéterminées classiques sont :
$$\\left[ \\frac{0}{0} \\right], \\quad \\left[ \\frac{\\infty}{\\infty} \\right], \\quad [+\\infty - \\infty], \\quad [0 \\times \\infty]$$

##### Méthode A : Factorisation par le Terme Prépondérant (au voisinage de $\\pm\\infty$)
Pour une fonction rationnelle $f(x) = \\frac{P(x)}{Q(x)}$ où $P$ et $Q$ sont des polynômes :
* La limite en $\\pm\\infty$ est égale à la limite du quotient des termes de plus haut degré.
$$\\lim_{x \\to +\\infty} \\frac{3x^3 - 5x + 2}{2x^3 + 7x^2 - 1} = \\lim_{x \\to +\\infty} \\frac{3x^3}{2x^3} = \\frac{3}{2}$$

##### Méthode B : Multiplication par l'Expression Conjuguée (Présence de Radicaux)
Face à une différence de racines carrées générant une indétermination $[+\\infty - \\infty]$ :
$$\\sqrt{A} - \\sqrt{B} = \\frac{(\\sqrt{A} - \\sqrt{B})(\\sqrt{A} + \\sqrt{B})}{\\sqrt{A} + \\sqrt{B}} = \\frac{A - B}{\\sqrt{A} + \\sqrt{B}}$$

*Exemple d'Examen :* Calcul de $\\lim_{x \\to +\\infty} \\left( \\sqrt{x^2 + 4x + 1} - x \\right)$
$$= \\lim_{x \\to +\\infty} \\frac{(x^2 + 4x + 1) - x^2}{\\sqrt{x^2(1 + 4/x + 1/x^2)} + x} = \\lim_{x \\to +\\infty} \\frac{4x + 1}{x\\sqrt{1 + 4/x + 1/x^2} + x} = \\lim_{x \\to +\\infty} \\frac{x(4 + 1/x)}{x(\\sqrt{1 + 4/x + 1/x^2} + 1)} = \\frac{4}{1 + 1} = 2$$

##### Méthode C : Utilisation du Taux d'Accroissement (Nombre Dérivé)
Face à une indétermination $\\left[ \\frac{0}{0} \\right]$ en $x_0$ :
$$\\lim_{x \\to x_0} \\frac{f(x) - f(x_0)}{x - x_0} = f'(x_0)$$

*Limites Usuelles Indispensables :*
$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1, \\quad \\lim_{x \\to 0} \\frac{e^x - 1}{x} = 1, \\quad \\lim_{x \\to 0} \\frac{\\ln(1 + x)}{x} = 1, \\quad \\lim_{x \\to 0} \\frac{1 - \\cos x}{x^2} = \\frac{1}{2}$$

---

#### 3. Asymptotes et Branches Infinies
Soit $(C_f)$ la courbe représentative de $f$ dans un repère orthonormé $(O, \\vec{i}, \\vec{j})$ :

1. **Asymptote Verticale** : Si $\\lim_{x \\to x_0} f(x) = \\pm\\infty$, la droite d'équation $x = x_0$ est asymptote verticale à $(C_f)$.
2. **Asymptote Horizontale** : Si $\\lim_{x \\to \\pm\\infty} f(x) = L$, la droite d'équation $y = L$ est asymptote horizontale à $(C_f)$ en $\\pm\\infty$.
3. **Asymptote Oblique** : La droite $(\\Delta)$ d'équation $y = ax + b$ ($a \\ne 0$) est asymptote oblique à $(C_f)$ en $\\pm\\infty$ si et seulement si :
$$\\lim_{x \\to \\pm\\infty} [f(x) - (ax + b)] = 0$$

*Position Relative :* Le signe de $d(x) = f(x) - (ax + b)$ donne la position :
* Si $d(x) > 0$, $(C_f)$ est **au-dessus** de $(\\Delta)$.
* Si $d(x) < 0$, $(C_f)$ est **en-dessous** de $(\\Delta)$.`
            },
            {
                id: 'math-sm-l2',
                title: '2. Théorème des Valeurs Intermédiaires (TVI) & Bijection',
                duration: '2h00',
                completed: false,
                isLocked: false,
                content: `### Chapitre 2 : Théorème des Valeurs Intermédiaires (TVI) et Résolution Numérique

#### 1. Théorème Fondamental des Valeurs Intermédiaires
Soit $f$ une fonction définie et **continue** sur un intervalle fermé et borné $[a, b]$.
Pour tout réel $k$ compris entre $f(a)$ et $f(b)$, il existe **au moins un** réel $c \\in [a, b]$ tel que :
$$f(c) = k$$

*Cas particulier du Zéro (Théorème de Bolzano) :*
Si $f$ est continue sur $[a, b]$ et si $f(a) \\times f(b) < 0$, alors l'équation $f(x) = 0$ admet au moins une solution $c \\in ]a, b[$.

---

#### 2. Corollaire de la Bijection (Cas Strictement Monotone)
Si $f$ est continue et **strictement croissante** (ou strictement décroissante) sur $[a, b]$, alors pour tout réel $k$ appartenant à l'intervalle image $[f(a), f(b)]$ (ou $[f(b), f(a)]$), l'équation :
$$f(x) = k$$
admet une **unique solution** $\\alpha \\in [a, b]$.

#### 3. Rédaction Méthodologique Officielle Type Examen
Pour obtenir la totalité des points au Baccalauréat lors de la justification d'une solution unique :
1. **Continuité** : Justifier la continuité de $f$ sur l'intervalle $I$ (somme, produit ou quotient de fonctions continues).
2. **Stricte Monotonie** : Calculer $f'(x)$, étudier son signe et dresser le tableau de variations complet démontrant que $f$ est strictement monotone sur $I$.
3. **Intervalle Image** : Déterminer $f(I) = [m, M]$ (ou $]\\lim, \\lim[$).
4. **Appartenance** : Écrire explicitement que la valeur cible $k \\in f(I)$.
5. **Conclusion** : D'après le corollaire du théorème des valeurs intermédiaires, l'équation $f(x) = k$ admet une unique solution $\\alpha$ sur $I$.

#### 4. Encadrement de la Solution $\\alpha$ par Dichotomie
La méthode de dichotomie consiste à diviser l'intervalle $[a, b]$ par son milieu $m = \\frac{a+b}{2}$ :
* Si $f(a) \\times f(m) < 0$, alors $\\alpha \\in [a, m]$.
* Sinon, $\\alpha \\in [m, b]$.
À chaque étape $n$, la précision de l'encadrement est $\\frac{b - a}{2^n}$.`
            },
            {
                id: 'math-sm-l3',
                title: '3. Croissances Comparées des Fonctions Exponentielles et Logarithmiques',
                duration: '1h45',
                completed: false,
                isLocked: false,
                content: `### Chapitre 3 : Croissances Comparées (Exponentielles, Puissances, Logarithmes)

#### 1. Théorème Fondamental des Croissances Comparées
À l'infini, la fonction exponentielle l'emporte sur toute fonction puissance, qui elle-même l'emporte sur la fonction logarithme népérien.

Pour tout entier naturel $n \\ge 1$ et pour tout réel $\\alpha > 0$ :

1. **En $+\\infty$ pour l'exponentielle :**
$$\\lim_{x \\to +\\infty} \\frac{e^x}{x^n} = +\\infty \\quad \\text{et} \\quad \\lim_{x \\to +\\infty} \\frac{e^x}{x^\\alpha} = +\\infty$$

2. **En $-\\infty$ pour l'exponentielle :**
$$\\lim_{x \\to -\\infty} x^n e^x = 0$$

3. **En $+\\infty$ pour le logarithme népérien :**
$$\\lim_{x \\to +\\infty} \\frac{\\ln x}{x^n} = 0 \\quad \\text{et} \\quad \\lim_{x \\to +\\infty} \\frac{\\ln x}{x^\\alpha} = 0$$

4. **En $0^+$ pour le logarithme népérien :**
$$\\lim_{x \\to 0^+} x^n \\ln x = 0$$

---

#### 2. Démonstration Classique du Baccalauréat
*Démontrons que $\\lim_{x \\to +\\infty} \\frac{e^x}{x} = +\\infty$ :*
Pour tout $t \\ge 0$, on a $e^t \\ge 1 + t + \\frac{t^2}{2} > \\frac{t^2}{2}$.
En divisant par $t > 0$ :
$$\\frac{e^t}{t} > \\frac{t}{2}$$
Or $\\lim_{t \\to +\\infty} \\frac{t}{2} = +\\infty$.
Par le théorème de comparaison (minoration), on en déduit immédiatement :
$$\\lim_{x \\to +\\infty} \\frac{e^x}{x} = +\\infty$$`
            }
        ],
        practicalExercise: {
            title: "Étude Complète d'une Fonction avec Asymptote Oblique & TVI",
            context: "Sujet officiel adapté du Baccalauréat Sciences Mathématiques.",
            problemStatement: "Soit la fonction numérique f définie sur R par : f(x) = x + 1 + (2 / (e^x + 1)). On note (C) sa courbe représentative dans un repère orthonormé.",
            guidedSteps: [
                "1. Déterminer la limite de f en +infini et en -infini.",
                "2. Démontrer que la droite (D1) d'équation y = x + 1 est asymptote oblique à (C) en +infini.",
                "3. Démontrer que la droite (D2) d'équation y = x + 3 est asymptote oblique à (C) en -infini.",
                "4. Calculer la dérivée f'(x) et prouver que f est strictement croissante sur R.",
                "5. Démontrer que l'équation f(x) = 0 admet une unique solution alpha dans l'intervalle [-3, -2]."
            ],
            detailedSolution: `### Corrigé Détaillé et Barème Officiel

1. **Limites aux bornes :**
   * En $+\\infty$ : $\\lim_{x \\to +\\infty} e^x = +\\infty \\implies \\lim_{x \\to +\\infty} \\frac{2}{e^x + 1} = 0$. Donc $\\lim_{x \\to +\\infty} f(x) = +\\infty$.
   * En $-\\infty$ : $\\lim_{x \\to -\\infty} e^x = 0 \\implies \\lim_{x \\to -\\infty} \\frac{2}{e^x + 1} = 2$. Donc $\\lim_{x \\to -\\infty} f(x) = \\lim_{x \\to -\\infty} (x + 1 + 2) = -\\infty$.

2. **Asymptote en $+\\infty$ :**
   * $f(x) - (x + 1) = \\frac{2}{e^x + 1}$.
   * $\\lim_{x \\to +\\infty} [f(x) - (x + 1)] = \\lim_{x \\to +\\infty} \\frac{2}{e^x + 1} = 0$.
   * Donc la droite $(D_1) : y = x + 1$ est bien asymptote oblique à $(C)$ en $+\\infty$.

3. **Asymptote en $-\\infty$ :**
   * $f(x) - (x + 3) = x + 1 + \\frac{2}{e^x + 1} - x - 3 = \\frac{2}{e^x + 1} - 2 = \\frac{2 - 2(e^x + 1)}{e^x + 1} = \\frac{-2e^x}{e^x + 1}$.
   * Or $\\lim_{x \\to -\\infty} \\frac{-2e^x}{e^x + 1} = \\frac{0}{0 + 1} = 0$.
   * Donc la droite $(D_2) : y = x + 3$ est bien asymptote oblique à $(C)$ en $-\\infty$.

4. **Dérivée et Monotonie :**
   * Pour tout $x \\in \\mathbb{R}$, $f'(x) = 1 - \\frac{2e^x}{(e^x + 1)^2} = \\frac{(e^x + 1)^2 - 2e^x}{(e^x + 1)^2} = \\frac{e^{2x} + 2e^x + 1 - 2e^x}{(e^x + 1)^2} = \\frac{e^{2x} + 1}{(e^x + 1)^2}$.
   * Pour tout $x \\in \\mathbb{R}$, $e^{2x} + 1 > 0$ et $(e^x + 1)^2 > 0$.
   * Donc $f'(x) > 0$ pour tout $x$. $f$ est strictement croissante sur $\\mathbb{R}$.

5. **Existence et unicité de $\\alpha$ (TVI) :**
   * $f$ est continue et strictement croissante sur $[-3, -2]$.
   * $f(-3) = -3 + 1 + \\frac{2}{e^{-3} + 1} = -2 + \\frac{2}{1,0498} \\approx -0,095 < 0$.
   * $f(-2) = -2 + 1 + \\frac{2}{e^{-2} + 1} = -1 + \\frac{2}{1,1353} \\approx +0,761 > 0$.
   * $0 \\in [f(-3), f(-2)]$. D'après le corollaire du TVI, l'équation $f(x) = 0$ admet une unique solution $\\alpha \\in ]-3, -2[$.`
        },
        quizQuestions: [
            {
                id: 'qz-m-1',
                question: "Quelle est la limite en +infini de (3x² - sin(x)) / (x² + 4) ?",
                options: [
                    "3",
                    "0",
                    "+infini",
                    "N'existe pas car sin(x) oscille"
                ],
                correctIndex: 0,
                explanation: "Par encadrement, -1 <= sin(x) <= 1. En divisant par x² > 0, sin(x)/x² tend vers 0 en +infini. La limite est donc égale au quotient des termes dominants 3x²/x² = 3."
            },
            {
                id: 'qz-m-2',
                question: "Si lim [f(x) - (2x - 3)] = 0 quand x tend vers +infini, que peut-on affirmer ?",
                options: [
                    "La droite y = 2x - 3 est asymptote oblique à la courbe de f en +infini.",
                    "La fonction f est une fonction affine sur R.",
                    "f'(x) = 2 pour tout x.",
                    "f(x) ne s'annule jamais."
                ],
                correctIndex: 0,
                explanation: "C'est la définition exacte de l'asymptote oblique d'équation y = ax + b en +infini."
            }
        ],
        officialResources: [
            {
                title: "Fiche Officielle : Les 10 Limites Usuelles et Démonstrations Clés",
                type: "Fiche Synthèse",
                description: "Formulaire complet avec croissances comparées et règles d'Hospital approuvées."
            },
            {
                title: "Annales Corrigées du Baccalauréat (Sujets 2020-2026)",
                type: "Annales Corrigées",
                description: "Recueil officiel des épreuves de Mathématiques avec barème détaillé du jury."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. SCIENCES PHYSIQUES : CINÉMATIQUE & DYNAMIQUE DE NEWTON
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    'phys-sm-newton': {
        subjectId: 'gn-sm-phys',
        subjectName: 'Physique & Chimie',
        chapterId: 'gn-ch-phys-1',
        chapterTitle: 'Mécanique Newtonienne & Cinématique du Point',
        levelName: 'Terminale Sciences Mathématiques / S',
        description: 'Vecteurs cinématiques, 3 lois de Newton, mouvement d’un projectile dans un champ de pesanteur et énergie mécanique.',
        lessons: [
            {
                id: 'phys-sm-l1',
                title: '1. Les 3 Lois de Newton et le Principe Fondamental de la Dynamique (PFD)',
                duration: '2h30',
                completed: false,
                isLocked: false,
                content: `### Chapitre 1 : Les Lois Fondamentales de Newton

#### 1. Référentiels Galiléens et Vecteurs Cinématiques
Un référentiel est dit **galiléen** si le principe d'inertie y est rigoureusement vérifié (ex: référentiel terrestre pour des durées courtes, référentiel géocentrique, héliocentrique).

Dans un repère cartésien $(O, \\vec{i}, \\vec{j}, \\vec{k})$ :
* **Vecteur Position** : $\\vec{OM}(t) = x(t)\\vec{i} + y(t)\\vec{j} + z(t)\\vec{k}$
* **Vecteur Vitesse** : $\\vec{v}(t) = \\frac{\\mathrm{d}\\vec{OM}}{\\mathrm{d}t} = \\dot{x}\\vec{i} + \\dot{y}\\vec{j} + \\dot{z}\\vec{k}$
* **Vecteur Accélération** : $\\vec{a}(t) = \\frac{\\mathrm{d}\\vec{v}}{\\mathrm{d}t} = \\frac{\\mathrm{d}^2\\vec{OM}}{\\mathrm{d}t^2} = \\ddot{x}\\vec{i} + \\ddot{y}\\vec{j} + \\ddot{z}\\vec{k}$

---

#### 2. Énoncé des Trois Lois de Newton

##### 1ère Loi : Principe d'Inertie
Dans un référentiel galiléen, si la somme vectorielle des forces extérieures appliquées à un système matériel est nulle (système isolé ou pseudo-isolé), alors son vecteur vitesse $\\vec{v}_G$ est constant :
$$\\sum \\vec{F}_{ext} = \\vec{0} \\iff \\vec{v}_G = \\vec{C}^{ste}$$
Le centre d'inertie est soit au repos, soit en mouvement rectiligne uniforme.

##### 2ème Loi : Principe Fondamental de la Dynamique (PFD)
Dans un référentiel galiléen, la somme des forces extérieures appliquées à un point matériel de masse $m$ constante est égale au produit de sa masse par son vecteur accélération :
$$\\sum \\vec{F}_{ext} = m \\vec{a}_G = m \\frac{\\mathrm{d}\\vec{v}_G}{\\mathrm{d}t}$$

##### 3ème Loi : Principe des Actions Réciproques (Action-Réaction)
Pour deux corps $A$ et $B$ en interaction, la force $\\vec{F}_{A/B}$ exercée par $A$ sur $B$ et la force $\\vec{F}_{B/A}$ exercée par $B$ sur $A$ ont même droite d'action, même intensité et des sens opposés :
$$\\vec{F}_{A/B} = -\\vec{F}_{B/A}$$
Cette loi s'applique quel que soit l'état de mouvement des corps et la nature de l'interaction.`
            },
            {
                id: 'phys-sm-l2',
                title: '2. Mouvement d\'un Projectile dans un Champ de Pesanteur Uniforme',
                duration: '2h15',
                completed: false,
                isLocked: false,
                content: `### Chapitre 2 : Trajectoire et Équations Horaires d'un Projectile

#### 1. Conditions Initiales et Modélisation
Soit un projectile de masse $m$, lancé depuis l'origine $O(0, 0)$ à $t = 0$ avec une vitesse initiale $\\vec{v}_0$ faisant un angle $\\alpha$ avec l'horizontale.
On néglige les frottements de l'air. Le seul effort appliqué est le poids $\\vec{P} = m\\vec{g}$.

* **Vecteur Vitesse Initiale** :
$$\\vec{v}_0 = \\begin{pmatrix} v_0 \\cos\\alpha \\\\ v_0 \\sin\\alpha \\end{pmatrix}$$
* **Vecteur Champ de Pesanteur** :
$$\\vec{g} = \\begin{pmatrix} 0 \\\\ -g \\end{pmatrix}$$

---

#### 2. Intégration du PFD et Équations Horaires
D'après la 2ème loi de Newton :
$$m\\vec{a} = m\\vec{g} \\implies \\vec{a} = \\vec{g} = \\begin{pmatrix} 0 \\\\ -g \\end{pmatrix}$$

En intégrant par rapport au temps avec les conditions initiales :
$$\\vec{v}(t) = \\begin{pmatrix} v_0 \\cos\\alpha \\\\ -gt + v_0 \\sin\\alpha \\end{pmatrix}$$

En intégrant une seconde fois :
$$\\vec{OM}(t) = \\begin{pmatrix} x(t) = (v_0 \\cos\\alpha) t \\\\ y(t) = -\\frac{1}{2}gt^2 + (v_0 \\sin\\alpha) t \\end{pmatrix}$$

---

#### 3. Équation Cartésienne de la Trajectoire
En exprimant $t = \\frac{x}{v_0 \\cos\\alpha}$ et en le remplaçant dans $y(t)$ :
$$y(x) = -\\frac{g}{2 v_0^2 \\cos^2\\alpha} x^2 + (\\tan\\alpha) x$$
La trajectoire est une **parabole** contenue dans le plan vertical de tir.

#### 4. Grandeurs Remarquables du Tir
* **Flèche (Hauteur Maximale $H$)** : Atteinte quand $v_y = 0 \\implies t_S = \\frac{v_0 \\sin\\alpha}{g}$
$$H = y(t_S) = \\frac{v_0^2 \\sin^2\\alpha}{2g}$$

* **Portée (Distance Horizontale Maximale $X_P$)** : Atteinte quand $y(x) = 0$ ($x \\ne 0$)
$$X_P = \\frac{v_0^2 \\sin(2\\alpha)}{g}$$
La portée maximale pour une vitesse $v_0$ donnée est obtenue pour $\\alpha = 45^\\circ$ car $\\sin(2 \\times 45^\\circ) = \\sin(90^\\circ) = 1$.`
            }
        ],
        practicalExercise: {
            title: "Calcul de Tir Balistique et Sécurisation de Cible",
            context: "Épreuve pratique type Baccalauréat.",
            problemStatement: "Un canon tire un projectile depuis le sol à v0 = 100 m/s avec un angle alpha = 30° par rapport au sol (g = 9.8 m/s²).",
            guidedSteps: [
                "1. Établir les équations horaires x(t) et y(t).",
                "2. Déterminer l'instant tS où le projectile atteint le sommet de sa trajectoire.",
                "3. Calculer l'altitude maximale H.",
                "4. Calculer la portée totale XP du tir au sol."
            ],
            detailedSolution: `### Corrigé Pas à Pas

1. **Équations Horaires :**
   * $v_{0x} = 100 \\times \\cos(30^\\circ) = 100 \\times \\frac{\\sqrt{3}}{2} = 86,60 \\text{ m/s}$.
   * $v_{0y} = 100 \\times \\sin(30^\\circ) = 100 \\times 0,5 = 50 \\text{ m/s}$.
   * $x(t) = 86,60 t$
   * $y(t) = -4,9 t^2 + 50 t$

2. **Instant du sommet :**
   * $v_y(t_S) = -9,8 t_S + 50 = 0 \\implies t_S = \\frac{50}{9,8} \\approx 5,10 \\text{ s}$.

3. **Hauteur Maximale (Flèche) :**
   * $H = y(5,10) = -4,9 \\times (5,10)^2 + 50 \\times (5,10) = -127,45 + 255 = 127,55 \\text{ m}$.

4. **Portée totale au sol :**
   * $y(t) = 0 \\implies t(-4,9t + 50) = 0 \\implies t_P = \\frac{50}{4,9} \\approx 10,20 \\text{ s}$.
   * $X_P = x(10,20) = 86,60 \\times 10,20 = 883,32 \\text{ m}$.`
        },
        quizQuestions: [
            {
                id: 'qz-p-1',
                question: "Pour un tir de projectile dans le vide sans frottement, quel angle de tir permet d'obtenir la portée maximale sur terrain plat ?",
                options: [
                    "45 degrés",
                    "30 degrés",
                    "60 degrés",
                    "90 degrés"
                ],
                correctIndex: 0,
                explanation: "La portée XP = (v0² * sin(2*alpha)) / g est maximale quand sin(2*alpha) = 1, soit 2*alpha = 90° d'où alpha = 45°."
            }
        ],
        officialResources: [
            {
                title: "Guide des Équations Différentielles de la Mécanique",
                type: "Formulaire",
                description: "Synthèse des théorèmes de l'énergie cinétique, mécanique et lois de Newton."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. PHILOSOPHIE : LA LIBERTÉ, LA CONSCIENCE ET LA JUSTICE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    'philo-tle-liberte': {
        subjectId: 'gn-sub-philo-tle',
        subjectName: 'Philosophie & Pensée Critique',
        chapterId: 'gn-ch-philo-1',
        chapterTitle: 'La Liberté, Le Déterminisme et la Responsabilité Éthique',
        levelName: 'Terminale (Toutes Séries)',
        description: 'Examen philosophique de la condition humaine, du libre arbitre face aux déterminismes physiques, biologiques et sociaux.',
        lessons: [
            {
                id: 'philo-l1',
                title: '1. Le Libre Arbitre : Illusion Psychologique ou Pouvoir Fondateur ?',
                duration: '2h00',
                completed: false,
                isLocked: false,
                content: `### Chapitre 1 : La Liberté entre Illusion et Volonté Éclairée

#### 1. Définition et Problématique Centrale
La liberté est communément définie comme l'absence de contrainte extérieure : « faire ce que l'on veut ».
Cependant, la réflexion philosophique interroge :
*Vouloir ce que l'on fait suffit-il pour être libre, si notre volonté elle-même est déterminée par des causes inconscientes ou extérieures ?*

---

#### 2. La Critique Spinoziste du Libre Arbitre (Spinoza, *Éthique*)
Pour Baruch Spinoza, le libre arbitre est une pure illusion née de l'ignorance des causes réelles qui nous meuvent :

> *« Les hommes se croient libres pour cette seule cause qu'ils sont conscients de leurs actions et ignorants des causes par où ils sont déterminés. »*  
> — Spinoza, *Lettre à Schuller*

*L'Analogie de la Pierre :* Si une pierre en mouvement venait à avoir conscience d'elle-même, elle croirait voler par sa propre impulsion, alors qu'elle ne fait que suivre l'impulsion physique initiale.

---

#### 3. La Liberté Cartésienne et le Dépassement de l'Indifférence
René Descartes hiérarchise deux formes de liberté :
1. **La Liberté d'Indifférence** (le plus bas degré de la liberté) : Choisir arbitrairement entre deux options équivalentes sans motif rationnel.
2. **La Liberté Éclairée** (le plus haut degré) : Lorsque la raison perçoit si clairement le bien ou le vrai que la volonté y adhère spontanément et sans hésitation.

---

#### 4. L'Existentialisme Sartrien : L'Homme Condamné à Être Libre
Jean-Paul Sartre affirme que chez l'homme, **l'existence précède l'essence** :
* L'être humain n'est pas prédéterminé par une nature figée. Il se définit continuellement par ses actes et ses choix.
* Tenter d'échapper à sa liberté en invoquant son passé, son éducation ou son caractère relève de la **« Mauvaise Foi »**.`
            },
            {
                id: 'philo-l2',
                title: '2. Méthodologie Complète de la Dissertation Philosophique au Baccalauréat',
                duration: '1h45',
                completed: false,
                isLocked: false,
                content: `### Chapitre 2 : Structuration Rigoureuse d'une Dissertation Philosophique

#### 1. L'Analyse du Sujet et la Problématisation
Une dissertation philosophique ne récite pas un cours ; elle résout un **problème conceptuel**.

1. **Définir chaque mot clé** du sujet dans ses différents sens.
2. **Identifier le paradoxe** : Pourquoi la question posée ne va-t-elle pas de soi ? Quelle contradiction apparente fait émerger le problème ?
3. **Formuler la Problématique** : Une question centrale charnière mettant en tension deux thèses contradictoires mais légitimes.

---

#### 2. Structure Canonique en Trois Parties (Thèse - Antithèse - Synthèse / Dépassement)
* **Partie I (La Thèse Immédiate)** : Justification rigoureuse de l'opinion commune ou de la première réponse logique au sujet.
* **Partie II (La Limite / L'Antithèse)** : Réfutation des présupposés de la première partie par la confrontation avec les objections (déterminismes, paradoxes éthiques).
* **Partie III (Le Dépassement Conceptuel)** : Redéfinition du concept clé pour proposer une solution philosophique féconde qui dépasse l'opposition binaire.`
            }
        ],
        practicalExercise: {
            title: "Plan Détaillé de Dissertation Philosophique",
            context: "Sujet officiel du Baccalauréat : « Obéir aux lois, est-ce renoncer à sa liberté ? »",
            problemStatement: "Établissez l'introduction complète avec problématisation et le plan détaillé des 3 parties argumentées.",
            guidedSteps: [
                "1. Définir 'obéir', 'lois' et 'liberté'.",
                "2. Formuler le paradoxe : la contrainte légale semble nier l'autonomie individuelle, mais l'absence de loi conduit à la loi du plus fort.",
                "3. Rédiger la problématique.",
                "4. Détailler les 3 axes avec références d'auteurs (Hobbes, Rousseau, Kant)."
            ],
            detailedSolution: `### Modèle de Dissertation Corrigée

**Problématique :** La soumission à la loi politique constitue-t-elle l'aliénation de la liberté naturelle ou bien la seule condition de possibilité d'une liberté véritablement humaine et civile ?

**Axe I : La loi comme restriction et négation de la liberté naturelle**
* La liberté première s'éprouve comme l'absence d'entrave (licence naturelle).
* La loi positive impose des interdictions sous peine de sanction pénale.
* Référence : Thomas Hobbes (*Léviathan*) — pour sortir de l'état de guerre de tous contre tous, les hommes aliènent leur liberté naturelle au profit de la sécurité garantie par le souverain.

**Axe II : L'absence de loi détruit la liberté (La tyrannie du plus fort)**
* Dans un état sans loi, la liberté n'est qu'un mot vide car le plus fort peut à tout moment asservir le plus faible.
* Référence : John Locke (*Traité du gouvernement civil*) — « Là où il n'y a pas de loi, il n'y a pas de liberté ».

**Axe III : L'autonomie et la liberté civile par la loi légitime**
* Lorsque la loi émane de la volonté générale et que le citoyen participe à son élaboration, obéir à la loi revient à obéir à soi-même.
* Référence : Jean-Jacques Rousseau (*Du Contrat Social*) — « L'obéissance à la loi qu'on s'est prescrite est liberté ». L'homme passe de la liberté animale instinctive à la liberté morale et citoyenne.`
        },
        quizQuestions: [
            {
                id: 'qz-ph-1',
                question: "Selon Jean-Jacques Rousseau dans 'Du Contrat Social', quelle formule définit la véritable liberté civile ?",
                options: [
                    "L'obéissance à la loi qu'on s'est prescrite est liberté.",
                    "Faire absolument tout ce que l'on désire sans contrainte.",
                    "L'absence totale de tout gouvernement et de toute règle.",
                    "La soumission aveugle aux ordres du plus puissant."
                ],
                correctIndex: 0,
                explanation: "Rousseau montre que l'autonomie véritable consiste à obéir à la loi que la communauté citoyenne a elle-même instituée démocratiquement."
            }
        ],
        officialResources: [
            {
                title: "Anthologie des Grands Textes Philosophiques du Baccalauréat",
                type: "Manuel Officiel",
                description: "Textes choisis de Platon, Spinoza, Descartes, Kant, Rousseau et Sartre commentés par Professeur Diallo."
            }
        ]
    }
};

/**
 * Récupère un cours réel officiel complet par identifiant de matière et chapitre
 */
export function getRealCourseForSubject(subjectId: string, chapterId: string): RealSubjectCourse | null {
    // Recherche par clé directe
    for (const key of Object.keys(REAL_ACADEMIC_COURSES_REGISTRY)) {
        const course = REAL_ACADEMIC_COURSES_REGISTRY[key];
        if (course.subjectId === subjectId || course.chapterId === chapterId) {
            return course;
        }
    }
    return null;
}
