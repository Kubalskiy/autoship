"use client";

export function WaitlistForm() {
  return (
    <form
      className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="you@company.com"
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none sm:w-80"
        required
      />
      <button
        type="submit"
        className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-200 sm:w-auto"
      >
        Join Waitlist
      </button>
    </form>
  );
}
