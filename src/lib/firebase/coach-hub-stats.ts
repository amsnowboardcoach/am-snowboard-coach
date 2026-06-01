import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { bookingAwaitingCoachApproval } from "@/lib/booking/slot-hold";
import {
  countPaidWithoutInvoice,
  fetchCoachBookings,
} from "@/lib/firebase/bookings";
import { getFirebaseDb } from "@/lib/firebase/client";
import { fetchPendingMarketplaceListings } from "@/lib/firebase/marketplace-listings";
import { fetchStudentProgressVideos } from "@/lib/firebase/progress-videos";
import { fetchCoachStudents } from "@/lib/firebase/students";

export interface CoachHubStats {
  pendingBookings: number;
  pendingInvoices: number;
  pendingTribePosts: number;
  pendingMarketplaceListings: number;
  pendingVideos: number;
  studentCount: number;
  upcomingBookings: number;
}

export async function fetchCoachHubStats(
  coachId: string,
): Promise<CoachHubStats> {
  const now = Date.now();

  const [bookings, students, tribeSnap, pendingListings] = await Promise.all([
    fetchCoachBookings(coachId),
    fetchCoachStudents(coachId),
    getDocs(
      query(
        collection(getFirebaseDb(), "tribe_posts"),
        where("moderationStatus", "==", "pending"),
        limit(50),
      ),
    ),
    fetchPendingMarketplaceListings(50),
  ]);

  const pendingBookings = bookings.filter((b) =>
    bookingAwaitingCoachApproval(b),
  ).length;

  const upcomingBookings = bookings.filter(
    (b) => b.startAt.toMillis() >= now && b.status !== "cancelled",
  ).length;

  let pendingVideos = 0;
  if (students.length > 0) {
    const videoCounts = await Promise.all(
      students.map(async (s) => {
        const videos = await fetchStudentProgressVideos(s.uid);
        return videos.filter((v) => v.status === "pending_review").length;
      }),
    );
    pendingVideos = videoCounts.reduce((a, b) => a + b, 0);
  }

  return {
    pendingBookings,
    pendingInvoices: countPaidWithoutInvoice(bookings),
    pendingTribePosts: tribeSnap.size,
    pendingMarketplaceListings: pendingListings.length,
    pendingVideos,
    studentCount: students.length,
    upcomingBookings,
  };
}
