"use client";

import { CheckCircle, Clock, Truck, Package, XCircle, RefreshCw } from "lucide-react";

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  updatedAt?: string;
}

const STATUS_STEPS = [
  { key: "PENDING", label: "In attesa", icon: Clock },
  { key: "CONFIRMED", label: "Confermato", icon: CheckCircle },
  { key: "PROCESSING", label: "In lavorazione", icon: Package },
  { key: "SHIPPED", label: "Spedito", icon: Truck },
  { key: "DELIVERED", label: "Consegnato", icon: CheckCircle },
];

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key);

export default function OrderTimeline({ status, createdAt, updatedAt }: OrderTimelineProps) {
  const isCancelled = status === "CANCELLED" || status === "REFUNDED";
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Stato ordine</h3>

      {isCancelled ? (
        <div className="flex items-center gap-3 text-red-500">
          {status === "CANCELLED" ? <XCircle size={20} /> : <RefreshCw size={20} />}
          <span className="text-sm font-medium">
            {status === "CANCELLED" ? "Ordine annullato" : "Rimborso effettuato"}
          </span>
        </div>
      ) : (
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-gray-200"
            aria-hidden="true"
          />

          <ul className="space-y-4">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const done = idx <= currentIndex;
              const active = idx === currentIndex;

              return (
                <li key={step.key} className="flex items-start gap-3 relative">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      done
                        ? active
                          ? "bg-[#2271b1] text-white"
                          : "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${done ? "text-gray-800" : "text-gray-400"}`}>
                      {step.label}
                    </p>
                    {idx === 0 && (
                      <p className="text-xs text-gray-400">
                        {new Date(createdAt).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {active && updatedAt && idx > 0 && (
                      <p className="text-xs text-gray-400">
                        {new Date(updatedAt).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
