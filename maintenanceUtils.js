// maintenanceUtils.js

export async function fetchAllMaintenance(uid, vehicleSnap) {
  const results = [];

  const MAINTENANCE_INTERVALS = {
    "Engine Oil Check": 1,
    "Tire Check": 1,
    "Air Filter Check": 12,
    "Brake Fluid Check": 12,
    "General Inspection": 6,
  };

  if (vehicleSnap.exists()) {
    const data = vehicleSnap.data();
    const services = data.services || [];
    const latestServiceMap = {};
    let latestGeneralInspectionDate = null;

    services.forEach(service => {
      if (!service.date || !service.type) return;

      const { day, month, year } = service.date;
      const serviceDate = new Date(year, month - 1, day);

      const current = latestServiceMap[service.type];
      if (!current || serviceDate > new Date(current.date.year, current.date.month - 1, current.date.day)) {
        latestServiceMap[service.type] = { ...service, date: { day, month, year } };
      }

      if (service.type === "General Inspection") {
        if (!latestGeneralInspectionDate || serviceDate > latestGeneralInspectionDate) {
          latestGeneralInspectionDate = serviceDate;
        }
      }
    });

    const now = new Date();

    for (const [type, intervalMonths] of Object.entries(MAINTENANCE_INTERVALS)) {
      let baseDate;
      if (latestServiceMap[type]) {
        const { year, month, day } = latestServiceMap[type].date;
        baseDate = new Date(year, month - 1, day);
      } else if (latestGeneralInspectionDate) {
        baseDate = new Date(latestGeneralInspectionDate);
      } else {
        continue;
      }

      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + intervalMonths);

      if (dueDate < now) {
        results.push({ type, dueDate });
      }
    }

    results.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  return results;
}
