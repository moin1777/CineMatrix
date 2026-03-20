"use client";


import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

interface Hall {
  name: string;
  rows: number;
  columns: number;
  basePrice: number;
  // seatMap: any; // For future seat map builder integration
}

export default function VenueCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [halls, setHalls] = useState<Hall[]>([{
    name: "Screen 1",
    rows: 10,
    columns: 15,
    basePrice: 200,
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleHallChange = (idx: number, field: keyof Hall, value: any) => {
    setHalls(halls => halls.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  const addHall = () => {
    setHalls(halls => ([...halls, {
      name: `Screen ${halls.length + 1}`,
      rows: 10,
      columns: 15,
      basePrice: 200,
    }]));
  };

  const removeHall = (idx: number) => {
    setHalls(halls => halls.filter((_, i) => i !== idx));
  };

  // TODO: Integrate seat map builder for each hall

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 1. Create the venue
      const venueRes = await api.post<{ venue: { _id: string } }>(
        "/venues",
        {
          name,
          address,
          city,
          state,
          zipCode,
          phone,
          email,
        }
      );
      const venueId = venueRes.venue._id;

      // 2. Create each hall for the venue
      for (const hall of halls) {
        await api.post<{ hall: any }>(
          "/venues/halls",
          {
            venueId,
            name: hall.name,
            rows: hall.rows,
            seatsPerRow: hall.columns,
            basePrice: hall.basePrice,
          }
        );
      }

      setLoading(false);
      router.push("/admin/venues");
    } catch (err: any) {
      setError(err.message || "Failed to create venue");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-surface-card rounded-xl border border-gray-800 mt-8">
      <h1 className="text-2xl font-bold text-white mb-4">Add New Venue</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 mb-1">Venue Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Zip Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-2">Screens / Halls</h2>
          {halls.map((hall, idx) => (
            <div key={idx} className="mb-6 p-4 rounded-lg border border-gray-700 bg-surface-active">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={hall.name}
                  onChange={e => handleHallChange(idx, "name", e.target.value)}
                  required
                  className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white w-48"
                  placeholder={`Screen ${idx + 1} Name`}
                />
                {halls.length > 1 && (
                  <button type="button" onClick={() => removeHall(idx)} className="ml-2 text-red-400 hover:text-red-600">
                    Remove
                  </button>
                )}
              </div>
              <div className="flex gap-4 mb-2">
                <div>
                  <label className="block text-gray-400 mb-1">Rows</label>
                  <input
                    type="number"
                    min={1}
                    value={hall.rows}
                    onChange={e => handleHallChange(idx, "rows", Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Columns</label>
                  <input
                    type="number"
                    min={1}
                    value={hall.columns}
                    onChange={e => handleHallChange(idx, "columns", Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Base Price</label>
                  <input
                    type="number"
                    min={1}
                    value={hall.basePrice}
                    onChange={e => handleHallChange(idx, "basePrice", Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white"
                  />
                </div>
              </div>
              {/* TODO: Integrate seat map builder/preview for this hall */}
            </div>
          ))}
          <button type="button" onClick={addHall} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 mt-2">
            + Add Another Screen
          </button>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full py-2 rounded-lg font-semibold text-white transition-colors",
            loading ? "bg-gray-700" : "bg-primary-500 hover:bg-primary-600"
          )}
        >
          {loading ? "Creating..." : "Create Venue"}
        </button>
      </form>
    </div>
  );
}
