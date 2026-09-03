import { describe, it, expect } from 'vitest';
import {
  splitRosterHumansAndAgents,
  deriveStageAgentIds,
} from '../services/live/liveSessionService';
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
