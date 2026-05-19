function ServiceSelector({
  services,
  selected,
  onSelect,
}) {
  return (
    <div>
      <h3>Service</h3>

      <select
        value={selected?.id || ""}
        onChange={(e) => {
          const selectedService = services.find(
            (service) =>
              service.id === Number(e.target.value)
          );

          onSelect(selectedService);
        }}
      >
        <option value="">
          Select Service
        </option>

        {services.map((service) => (
          <option
            key={service.id}
            value={service.id}
          >
            {service.name} - {service.price} ETB
          </option>
        ))}
      </select>
    </div>
  );
}

export default ServiceSelector;