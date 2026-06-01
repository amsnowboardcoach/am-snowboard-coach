import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { isVideoCorrectionProduct } from "@/constants/video-correction";
import { getFirebaseDb } from "@/lib/firebase/client";
import { fetchStudentProgressVideos } from "@/lib/firebase/progress-videos";

const BOOKINGS = "bookings";

export interface VideoCorrectionAllowance {
  /** Cupos pagados (suma de videoCount en reservas pagadas) */
  paidSlots: number;
  /** Vídeos ya subidos en progress_videos */
  uploadedCount: number;
  /** Cupos disponibles para subir */
  remainingSlots: number;
  canUpload: boolean;
  /** Pago recibido; esperando que el coach acepte */
  awaitingCoachApproval: boolean;
  /** Solicitud pendiente sin pago (checkout no completado) */
  pendingRequest: boolean;
}

export async function fetchStudentVideoCorrectionAllowance(
  userId: string,
): Promise<VideoCorrectionAllowance> {
  const db = getFirebaseDb();

  const bookingsSnap = await getDocs(
    query(
      collection(db, BOOKINGS),
      where("userId", "==", userId),
    ),
  );

  let paidSlots = 0;
  let awaitingCoachApproval = false;
  let pendingRequest = false;

  for (const docSnap of bookingsSnap.docs) {
    const data = docSnap.data();
    const lessonTypeId = data.lessonTypeId as string | undefined;
    const productKind = data.productKind as string | undefined;
    const isVideo =
      productKind === "video_correction" ||
      isVideoCorrectionProduct(lessonTypeId);
    if (!isVideo) continue;

    const status = data.status as string;
    const paymentStatus = (data.payment as { status?: string })?.status;
    const paymentSettled =
      paymentStatus === "paid" || paymentStatus === "deposit_paid";

    if (status === "cancelled") continue;

    if (status === "pending") {
      if (paymentSettled) {
        awaitingCoachApproval = true;
      } else {
        pendingRequest = true;
      }
      continue;
    }

    if (status === "confirmed" && paymentSettled) {
      paidSlots += (data.videoCount as number | undefined) ?? 1;
    }
  }

  const videos = await fetchStudentProgressVideos(userId);
  const uploadedCount = videos.length;
  const remainingSlots = Math.max(0, paidSlots - uploadedCount);

  return {
    paidSlots,
    uploadedCount,
    remainingSlots,
    canUpload: remainingSlots > 0,
    awaitingCoachApproval,
    pendingRequest,
  };
}
