
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
      const dbConnect = (await import('@/lib/db')).default;
      await dbConnect();
  }
}
