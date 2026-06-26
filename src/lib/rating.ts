import { prisma } from "./prisma";

/**
 * Bir iş akışının rating istatistiklerini (count + average) yeniden hesaplar
 * ve Process modeline yazar. Puanlama endpointleri tarafından her
 * upsert/delete sonrası çağrılır.
 */
export async function recomputeProcessRating(processId: string) {
  const agg = await prisma.rating.aggregate({
    where: { processId },
    _avg: { score: true },
    _count: { _all: true },
  });
  await prisma.process.update({
    where: { id: processId },
    data: {
      ratingCount: agg._count._all,
      ratingAverage: agg._avg.score ?? 0,
    },
  });
}