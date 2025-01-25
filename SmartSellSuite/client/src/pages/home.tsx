import { ListingForm } from "@/components/listing-form";
import { ListingsGrid } from "@/components/listings-grid";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-6 mb-6">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Safe Yard Sale
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Snap, Price, and Sell Your Items with AI
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-7xl space-y-8 pb-16">
        <ListingForm />

        <section>
          <h2 className="text-2xl font-semibold mb-6 px-2">Current Listings</h2>
          <ListingsGrid />
        </section>
      </main>
    </div>
  );
}