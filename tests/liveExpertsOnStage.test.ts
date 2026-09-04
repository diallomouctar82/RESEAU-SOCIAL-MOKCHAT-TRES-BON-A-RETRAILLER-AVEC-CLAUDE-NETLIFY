import { describe, it, expect } from 'vitest';
import {
  splitRosterHumansAndAgents,
  deriveStageAgentIds,
} from '../services/live/liveSessionService';
import { composeStage, orderStageAgents } from '../hooks/useLiveTransport';
import type { LiveStageParticipant } from '../types';

/**
 * EX-2 — Les deux règles subtiles du « l'expert monte sur scène pour TOUT LE
 * MONDE », isolées ici parce que ce sont précisément elles qui, mal écrites,
 * reproduiraient le défaut d'origine : un expert visible seulement chez la
 * personne qui a appuyé.
 */

const humain = (id: string, extra: Partial<LiveStageParticipant> = {}): LiveStageParticipant => ({
  id,
  name: `Humain ${id}`,
  avatar: '',
  role: 'viewer',
  isMuted: false,
  isVideoOn: true,
  ...extra,
});

const expert = (agentId: string, extra: Partial<LiveStageParticipant> = {}): LiveStageParticipant => ({
  id: agentId,
  name: `Expert ${agentId}`,
  avatar: '',
  role: 'expert_ai',
  isMuted: false,
  isVideoOn: true,
  isAi: true,
  agentId,
  ...extra,
});

describe('EX-2 — séparation humains / experts dans le roster relu en base', () => {
  it('range les lignes agent (is_ai + agent_id) à part des comptes', () => {
    const { humans, agents } = splitRosterHumansAndAgents([
      humain('u-1', { role: 'host' }),
      expert('2'),
      humain('u-2'),
      expert('h1', { role: 'expert_human', isAi: true }),
    ]);
    expect(humans.map(h => h.id)).toEqual(['u-1', 'u-2']);
    expect(agents.map(a => a.agentId)).toEqual(['2', 'h1']);
  });

  it("ne sort JAMAIS un humain de la liste des comptes — c'est ce qui casserait couper le micro / retirer quelqu'un", () => {
    const { humans, agents } = splitRosterHumansAndAgents([humain('u-1'), humain('u-2'), humain('u-3')]);
    expect(humans).toHaveLength(3);
    expect(agents).toHaveLength(0);
  });

  it('une ligne is_ai SANS agent_id reste côté comptes (donnée incohérente : on ne devine pas)', () => {
    const { humans, agents } = splitRosterHumansAndAgents([humain('u-1', { isAi: true })]);
    expect(humans).toHaveLength(1);
    expect(agents).toHaveLength(0);
  });

  it('un roster vide donne deux listes vides, jamais une carte inventée', () => {
    expect(splitRosterHumansAndAgents([])).toEqual({ humans: [], agents: [] });
  });
});

describe('EX-2 — qui occupe la scène côté agents, et depuis quelle source', () => {
  const catalogue = ['1', '2', '5', 'h1'];

  it("hors session persistée, le copilote local reste affiché (rien de plus vrai à lire)", () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: false,
        copilotId: '1',
        rosterAgentIds: [],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual(['1']);
  });

  it("DÈS QU'UN DIRECT RÉEL EXISTE, seule la base décide — le copilote local n'est plus réinjecté", () => {
    // C'est LE correctif : avant, chaque client rajoutait son propre `aiAgent`
    // à chaque rendu, si bien qu'un retrait ne descendait que chez l'animateur.
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: '1',
        rosterAgentIds: [],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual([]);
  });

  it('un expert présent en base est sur scène, même si ce n\'est pas le copilote', () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: '1',
        rosterAgentIds: ['2', '5'],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual(['2', '5']);
  });

  it('le copilote revient dès que sa ligne existe réellement en base', () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: '1',
        rosterAgentIds: ['1', '2'],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual(['1', '2']);
  });

  it('un expert retiré ne réapparaît pas, même si le roster est en retard d\'un cycle', () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: '1',
        rosterAgentIds: ['1', '2'],
        retiredAgentIds: ['2'],
        knownAgentIds: catalogue,
      }),
    ).toEqual(['1']);
  });

  it('un même expert présent deux fois ne donne pas deux cartes', () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: '1',
        rosterAgentIds: ['2', '2', '2'],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual(['2']);
  });

  it("un agent inconnu du catalogue client est ignoré plutôt qu'affiché en carte vide", () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: '1',
        rosterAgentIds: ['2', 'agent-fantome'],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual(['2']);
  });

  it('sans copilote et sans expert en base, la scène agents est vide — aucune présence inventée', () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: undefined,
        rosterAgentIds: [],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual([]);
  });

  it("l'ordre de la base est conservé — la scène ne se réordonne pas d'un cycle à l'autre", () => {
    expect(
      deriveStageAgentIds({
        hasRealSession: true,
        copilotId: '5',
        rosterAgentIds: ['h1', '2', '5'],
        retiredAgentIds: [],
        knownAgentIds: catalogue,
      }),
    ).toEqual(['h1', '2', '5']);
  });
});

describe("EX-5 — mettre l'expert en avant, puis le faire redescendre", () => {
  const humains = [
    { id: 'u-1', name: 'Awa' },
    { id: 'u-2', name: 'Sekou' },
    { id: 'u-3', name: 'Mariama' },
    { id: 'u-4', name: 'Fatou' },
  ];
  const experts = [
    { id: '1', name: 'Diallo' },
    { id: '2', name: 'Maître Diallo' },
    { id: '5', name: 'Docteur Diallo' },
  ];

  it("sans mise en avant, l'ordre historique est conservé (aucune régression)", () => {
    const scene = composeStage({ isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts });
    expect(scene.tiles.map(t => t.id)).toEqual([
      'self', 'human:u-1', 'human:u-2', 'human:u-3', 'human:u-4', 'agent:1',
    ]);
    expect(scene.overflow).toBe(2); // les experts 2 et 5 débordent
  });

  it("l'expert mis en avant passe en PREMIÈRE carte", () => {
    const scene = composeStage({
      isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts, spotlightAgentId: '2',
    });
    expect(scene.tiles[0].id).toBe('agent:2');
  });

  it("un expert mis en avant ne peut JAMAIS rester dans le débordement — sinon la mise en avant ne veut rien dire", () => {
    // Sans mise en avant, l'expert « 5 » est invisible (scène pleine).
    const sans = composeStage({ isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts });
    expect(sans.tiles.some(t => t.id === 'agent:5')).toBe(false);
    // Mis en avant, il est visible.
    const avec = composeStage({
      isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts, spotlightAgentId: '5',
    });
    expect(avec.tiles.some(t => t.id === 'agent:5')).toBe(true);
    expect(avec.tiles[0].id).toBe('agent:5');
  });

  it('le nombre total de présences et le débordement restent exacts', () => {
    const scene = composeStage({
      isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts, spotlightAgentId: '5',
    });
    expect(scene.presenceCount).toBe(8); // 1 + 4 humains + 3 experts
    expect(scene.tiles.length + scene.overflow).toBe(8);
  });

  it("mettre en avant un expert ABSENT de la scène ne fabrique pas sa carte", () => {
    const scene = composeStage({
      isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts, spotlightAgentId: 'h1',
    });
    expect(scene.tiles.some(t => t.id === 'agent:h1')).toBe(false);
    expect(scene.tiles[0].id).toBe('self');
  });

  it("faire redescendre (spotlight retiré) rend exactement la scène d'origine", () => {
    const avant = composeStage({ isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts });
    const apres = composeStage({
      isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts, spotlightAgentId: undefined,
    });
    expect(apres).toEqual(avant);
  });
});

/**
 * EX-6 — Ce que le banc réel a trouvé et que les tests précédents ne pouvaient
 * pas voir : `composeStage` décidait bien la première place, mais le rendu
 * peignait ses cartes d'agent dans un bloc fixe, toujours après la caméra et
 * les humains. « À LA UNE » posait donc un libellé sans rien déplacer.
 * `orderStageAgents` est la règle qui réconcilie les deux — testée ici pour
 * qu'aucune réécriture du JSX ne puisse la reperdre en silence.
 */
describe("EX-6 — la scène est PEINTE dans l'ordre décidé, pas dans l'ordre du code", () => {
  const humains = [{ id: 'u-1', name: 'Awa' }];
  const experts = [{ id: '1', name: 'Diallo' }, { id: '2', name: 'Maître Diallo' }];

  it("sans mise en avant, les experts restent APRÈS les présences humaines", () => {
    const scene = composeStage({ isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts });
    const { visibles, enTete } = orderStageAgents(experts, scene.tiles);
    expect(enTete).toBe(false);
    expect(visibles.map(a => a.id)).toEqual(['1', '2']);
  });

  it("l'expert mis en avant fait passer le bloc des experts EN TÊTE", () => {
    const scene = composeStage({
      isUserOnStage: true, selfName: 'Moi', humans: humains, agents: experts, spotlightAgentId: '2',
    });
    const { visibles, enTete } = orderStageAgents(experts, scene.tiles);
    expect(enTete).toBe(true);
    // …et il est le PREMIER de ce bloc : sa carte est donc bien la première de
    // toute la scène, ce qui est le sens même de « mettre en avant ».
    expect(visibles[0].id).toBe('2');
  });

  it('un expert resté dans le débordement n\'est pas peint du tout', () => {
    const beaucoup = [{ id: '1', name: 'a' }, { id: '2', name: 'b' }, { id: '5', name: 'c' }, { id: 'h1', name: 'd' }];
    const foule = [
      { id: 'u-1', name: 'A' }, { id: 'u-2', name: 'B' }, { id: 'u-3', name: 'C' }, { id: 'u-4', name: 'D' },
    ];
    const scene = composeStage({ isUserOnStage: true, selfName: 'Moi', humans: foule, agents: beaucoup });
    const { visibles } = orderStageAgents(beaucoup, scene.tiles);
    expect(scene.overflow).toBeGreaterThan(0);
    expect(visibles.map(a => a.id)).toEqual(['1']);
  });

  it("l'ordre suit la scène, jamais l'ordre d'arrivée dans le catalogue", () => {
    const scene = composeStage({
      isUserOnStage: false, humans: [], agents: experts, spotlightAgentId: '2',
    });
    // Le catalogue reste dans son ordre à lui : c'est bien la scène qui décide.
    const { visibles } = orderStageAgents([...experts].reverse(), scene.tiles);
    expect(visibles.map(a => a.id)).toEqual(['2', '1']);
  });

  it('aucun agent sur scène : rien à peindre, et surtout rien en tête', () => {
    const scene = composeStage({ isUserOnStage: true, selfName: 'Moi', humans: humains, agents: [] });
    const { visibles, enTete } = orderStageAgents(experts, scene.tiles);
    expect(visibles).toEqual([]);
    expect(enTete).toBe(false);
  });
});
