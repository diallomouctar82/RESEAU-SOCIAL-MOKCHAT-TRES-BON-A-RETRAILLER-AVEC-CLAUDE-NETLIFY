import type { Certificate, Enrollment, ExamSession } from '../types';
import { moduleRepository } from './moduleRepository';

type SerializedExamSession = Omit<ExamSession, 'startedAt'> & { startedAt: string };
interface EnrollmentPayload {
  enrollment: Omit<Enrollment, 'dateEnrolled' | 'lastAccessed' | 'examSession'> & {
    dateEnrolled: string;
    lastAccessed: string;
    examSession?: SerializedExamSession;
  };
}

interface CertificateClaimPayload {
  certificate: Certificate;
  verificationStatus: 'self_reported';
}

const toEnrollment = (payload: EnrollmentPayload): Enrollment => ({
  ...payload.enrollment,
  dateEnrolled: new Date(payload.enrollment.dateEnrolled),
  lastAccessed: new Date(payload.enrollment.lastAccessed),
  examSession: payload.enrollment.examSession ? {
    ...payload.enrollment.examSession,
    startedAt: new Date(payload.enrollment.examSession.startedAt),
  } : undefined,
});

export const campusRepository = {
  async getEnrollments(userId?: string): Promise<Enrollment[]> {
    const records = await moduleRepository.list<EnrollmentPayload>('campus', 'enrollment', userId);
    return records.map((record) => toEnrollment(record.payload));
  },

  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<Enrollment> {
    const records = await moduleRepository.list<EnrollmentPayload>('campus', 'enrollment', userId);
    const existing = records.find((record) => record.payload.enrollment.courseId === courseId);
    const now = new Date().toISOString();
    const current = existing?.payload.enrollment;
    const completedLessons = [...new Set([...(current?.completedLessons ?? []), lessonId])];
    const enrollment: EnrollmentPayload['enrollment'] = {
      id: current?.id ?? `${userId}_${courseId}`,
      userId,
      courseId,
      dateEnrolled: current?.dateEnrolled ?? now,
      completedLessons,
      lastAccessed: now,
      isCompleted: current?.isCompleted ?? false,
      examSession: current?.examSession,
    };
    await moduleRepository.upsert('campus', 'enrollment', { enrollment }, {
      id: existing?.id,
      ownerId: userId,
      idempotencyKey: `enrollment:${courseId}`,
    });
    return toEnrollment({ enrollment });
  },

  async saveExamSession(userId: string, courseId: string, session: ExamSession): Promise<void> {
    const records = await moduleRepository.list<EnrollmentPayload>('campus', 'enrollment', userId);
    const existing = records.find((record) => record.payload.enrollment.courseId === courseId);
    if (!existing) throw new Error('CAMPUS_ENROLLMENT_REQUIRED');
    const enrollment = {
      ...existing.payload.enrollment,
      lastAccessed: new Date().toISOString(),
      isCompleted: Boolean(session.passed),
      examSession: { ...session, startedAt: session.startedAt.toISOString() },
    };
    await moduleRepository.upsert('campus', 'enrollment', { enrollment }, {
      id: existing.id,
      ownerId: userId,
      idempotencyKey: `enrollment:${courseId}`,
    });
  },

  async saveCertificateClaim(certificate: Certificate, userId?: string): Promise<void> {
    await moduleRepository.upsert<CertificateClaimPayload>('campus', 'certificate_claim', {
      certificate,
      verificationStatus: 'self_reported',
    }, {
      ownerId: userId,
      status: 'draft',
      idempotencyKey: `certificate:${certificate.id}`,
    });
  },

  async getCertificateClaims(userId?: string): Promise<Certificate[]> {
    const records = await moduleRepository.list<CertificateClaimPayload>('campus', 'certificate_claim', userId);
    return records.map((record) => record.payload.certificate);
  },
};
