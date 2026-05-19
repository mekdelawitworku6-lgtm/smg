import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import API from "../api/axios";
import { logout } from "../auth/authSlice";
import defaultServicesData from "../data/services";
import defaultStaff from "../data/staff";
import { getTransactions } from "../transactions/transactionSlice";

const emptyServiceForm = {
  name: "",
  category: "",
  subcategory: "",
  price: "",
};

const storageKeys = {
  categories: "adminServiceCategories",
  subcategories: "adminServiceSubcategories",
  services: "adminLocalServices",
  staff: "adminStaffList",
};

const flattenDefaultServices = () =>
  defaultServicesData.flatMap((category) =>
    category.subcategories.flatMap((subcategory) =>
      subcategory.services.map((service, index) => ({
        _id: `local-${category.category}-${subcategory.name}-${index}`,
        name: service.name,
        category: category.category,
        subcategory: subcategory.name,
        price: service.price,
        localOnly: true,
      }))
    )
  );

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, loading, error } = useSelector(
    (state) => state.transactions
  );

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] =
    useState(false);
  const [serviceApiReady, setServiceApiReady] =
    useState(true);
  const [message, setMessage] = useState("");
  const [serviceForm, setServiceForm] =
    useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] =
    useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] =
    useState({
      category: "",
      name: "",
    });
  const [editingCategory, setEditingCategory] =
    useState("");
  const [categoryEditValue, setCategoryEditValue] =
    useState("");
  const [editingSubcategory, setEditingSubcategory] =
    useState(null);
  const [subcategoryEditValue, setSubcategoryEditValue] =
    useState("");
  const [categoryOptions, setCategoryOptions] =
    useState(() =>
      readJson(storageKeys.categories, [])
    );
  const [subcategoryOptions, setSubcategoryOptions] =
    useState(() =>
      readJson(storageKeys.subcategories, {})
    );
  const [staffList, setStaffList] = useState(() =>
    readJson(storageKeys.staff, defaultStaff)
  );
  const [staffName, setStaffName] = useState("");
  const [editingStaff, setEditingStaff] = useState("");
  const [activeView, setActiveView] =
    useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    dispatch(getTransactions());
  }, [dispatch]);

  const loadServices = async () => {
    setServicesLoading(true);
    setMessage("");
    const localServices = readJson(
      storageKeys.services,
      []
    );

    try {
      const res = await API.get("/services");
      const apiServices = Array.isArray(res.data)
        ? res.data
        : [];

      const mergedServices = apiServices.length > 0
        ? (() => {
            const defaults = flattenDefaultServices();
            const map = new Map();
            for (const s of defaults) {
              map.set(`${s.category}|${s.subcategory}|${s.name}`, s);
            }
            for (const s of apiServices) {
              map.set(`${s.category}|${s.subcategory}|${s.name}`, s);
            }
            for (const s of localServices) {
              map.set(`${s.category}|${s.subcategory}|${s.name}`, s);
            }
            return Array.from(map.values());
          })()
        : [...localServices, ...flattenDefaultServices()];

      setServices(mergedServices);
      setServiceApiReady(true);
    } catch (err) {
      setServices([
        ...localServices,
        ...flattenDefaultServices(),
      ]);
      setServiceApiReady(false);
      const status = err.response?.status;

      setMessage(
        status === 401
          ? "Please login again so admin service changes can be saved."
          : "Backend service route is not reachable, showing the default service list."
      );
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const validTransactions = list
    .map((tx) => {
      if (!tx) {
        return null;
      }

      const services = Array.isArray(tx.services)
        ? tx.services
        : tx.serviceName
          ? [
              {
                name: tx.serviceName,
                staff: tx.staffName,
                price: tx.price,
              },
            ]
          : [];
      const total =
        Number(tx.total ?? tx.amount) ||
        services.reduce(
          (sum, service) =>
            sum + (Number(service.price) || 0),
          0
        );
      const createdAt =
        tx.createdAt || tx.created_at || tx.date;

      if (
        !createdAt ||
        Number.isNaN(new Date(createdAt).getTime()) ||
        (services.length === 0 && total <= 0)
      ) {
        return null;
      }

      return {
        ...tx,
        services,
        total,
        createdAt,
        paymentType:
          tx.paymentType || tx.paymentMethod || "Payment",
      };
    })
    .filter(Boolean);

  const filteredTransactions = validTransactions.filter(
    (tx) =>
      new Date(tx.createdAt).toISOString().split("T")[0] === selectedDate
  );

  const dailyServicesCompleted = filteredTransactions.reduce(
    (count, tx) => count + tx.services.length,
    0
  );

  const dailyStaffActive = new Set();
  filteredTransactions.forEach((tx) =>
    tx.services.forEach((svc) => {
      if (svc.staff) dailyStaffActive.add(svc.staff);
    })
  );

  const totalRevenue = validTransactions.reduce(
    (sum, tx) => sum + (Number(tx.total) || 0),
    0
  );

  const now = new Date();
  const monthRevenue = validTransactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);

      return (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce(
      (sum, tx) => sum + (Number(tx.total) || 0),
      0
    );

  const staffStats = {};

  validTransactions.forEach((tx) => {
    tx.services.forEach((service) => {
      if (!service.staff) return;
      if (!staffStats[service.staff]) {
        staffStats[service.staff] = {
          services: 0,
          dailyActive: new Set(),
        };
      }

      staffStats[service.staff].services += 1;
      if (tx.createdAt) {
        staffStats[service.staff].dailyActive.add(
          new Date(tx.createdAt).toISOString().split("T")[0]
        );
      }
    });
  });

  Object.values(staffStats).forEach((s) => {
    s.activeDays = s.dailyActive.size;
    delete s.dailyActive;
  });

  const serviceCategories = useMemo(
    () =>
      [
        ...new Set([
          ...categoryOptions,
          ...services.map((service) => service.category),
        ].filter(Boolean)),
      ].sort(),
    [categoryOptions, services]
  );

  const categorySubcategories = useMemo(() => {
    const map = {};

    services.forEach((service) => {
      if (!service.category || !service.subcategory) {
        return;
      }

      map[service.category] = map[service.category] || [];

      if (
        !map[service.category].includes(
          service.subcategory
        )
      ) {
        map[service.category].push(service.subcategory);
      }
    });

    Object.entries(subcategoryOptions).forEach(
      ([category, subcategories]) => {
        map[category] = [
          ...new Set([
            ...(map[category] || []),
            ...subcategories,
          ]),
        ];
      }
    );

    return map;
  }, [services, subcategoryOptions]);

  const serviceSubcategories =
    categorySubcategories[serviceForm.category] || [];

  const persistCategories = (nextCategories) => {
    setCategoryOptions(nextCategories);
    localStorage.setItem(
      storageKeys.categories,
      JSON.stringify(nextCategories)
    );
  };

  const persistSubcategories = (nextMap) => {
    setSubcategoryOptions(nextMap);
    localStorage.setItem(
      storageKeys.subcategories,
      JSON.stringify(nextMap)
    );
  };

  const persistStaff = (nextStaff) => {
    setStaffList(nextStaff);
    localStorage.setItem(
      storageKeys.staff,
      JSON.stringify(nextStaff)
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const category = newCategory.trim();

    if (!category) {
      return;
    }

    if (!serviceCategories.includes(category)) {
      persistCategories(
        [...categoryOptions, category].sort()
      );
    }

    setServiceForm((current) => ({
      ...current,
      category,
      subcategory: "",
    }));
    setNewSubcategory({
      category,
      name: "",
    });
    setNewCategory("");
  };

  const handleAddSubcategory = (e) => {
    e.preventDefault();
    const category =
      newSubcategory.category || serviceForm.category;
    const name = newSubcategory.name.trim();

    if (!category || !name) {
      return;
    }

    const existing = categorySubcategories[category] || [];

    if (!existing.includes(name)) {
      persistSubcategories({
        ...subcategoryOptions,
        [category]: [
          ...(subcategoryOptions[category] || []),
          name,
        ].sort(),
      });
    }

    setServiceForm((current) => ({
      ...current,
      category,
      subcategory: name,
    }));
    setNewSubcategory({
      category,
      name: "",
    });
  };

  const updateServicesByMatch = async (
    matcher,
    updates
  ) => {
    if (!serviceApiReady) {
      setServices((current) =>
        current.map((service) =>
          matcher(service)
            ? { ...service, ...updates }
            : service
        )
      );
      return;
    }

    const matchedServices = services.filter(
      (service) =>
        matcher(service) && !service.localOnly
    );

    if (matchedServices.length === 0) {
      setServices((current) =>
        current.map((service) =>
          matcher(service)
            ? { ...service, ...updates }
            : service
        )
      );
      return;
    }

    await Promise.all(
      matchedServices.map((service) =>
        API.put(`/services/${service._id}`, updates)
      )
    );

    await loadServices();
  };

  const handleRenameCategory = async (category) => {
    const nextName = categoryEditValue.trim();

    if (!nextName || nextName === category) {
      setEditingCategory("");
      return;
    }

    await updateServicesByMatch(
      (service) => service.category === category,
      { category: nextName }
    );

    persistCategories(
      [
        ...categoryOptions.filter(
          (item) => item !== category
        ),
        nextName,
      ].sort()
    );

    const nextSubcategories = {
      ...subcategoryOptions,
      [nextName]: [
        ...new Set([
          ...(subcategoryOptions[nextName] || []),
          ...(subcategoryOptions[category] || []),
        ]),
      ],
    };

    delete nextSubcategories[category];
    persistSubcategories(nextSubcategories);
    setEditingCategory("");
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category ${category}?`)) {
      return;
    }

    if (serviceApiReady) {
      const matchedServices = services.filter(
        (service) =>
          service.category === category &&
          !service.localOnly
      );

      if (matchedServices.length === 0) {
        setServices((current) =>
          current.filter(
            (service) => service.category !== category
          )
        );
      } else {
        await Promise.all(
          matchedServices.map((service) =>
            API.delete(`/services/${service._id}`)
          )
        );

        await loadServices();
      }
    } else {
      setServices((current) =>
        current.filter(
          (service) => service.category !== category
        )
      );
    }

    persistCategories(
      categoryOptions.filter((item) => item !== category)
    );

    const nextSubcategories = {
      ...subcategoryOptions,
    };
    delete nextSubcategories[category];
    persistSubcategories(nextSubcategories);
  };

  const handleRenameSubcategory = async (
    category,
    subcategory
  ) => {
    const nextName = subcategoryEditValue.trim();

    if (!nextName || nextName === subcategory) {
      setEditingSubcategory(null);
      return;
    }

    await updateServicesByMatch(
      (service) =>
        service.category === category &&
        service.subcategory === subcategory,
      { subcategory: nextName }
    );

    persistSubcategories({
      ...subcategoryOptions,
      [category]: [
        ...new Set([
          ...(subcategoryOptions[category] || []).filter(
            (item) => item !== subcategory
          ),
          nextName,
        ]),
      ].sort(),
    });
    setEditingSubcategory(null);
  };

  const handleDeleteSubcategory = async (
    category,
    subcategory
  ) => {
    if (
      !window.confirm(
        `Delete subcategory ${subcategory}?`
      )
    ) {
      return;
    }

    if (serviceApiReady) {
      const matchedServices = services.filter(
        (service) =>
          service.category === category &&
          service.subcategory === subcategory &&
          !service.localOnly
      );

      if (matchedServices.length === 0) {
        setServices((current) =>
          current.filter(
            (service) =>
              !(
                service.category === category &&
                service.subcategory === subcategory
              )
          )
        );
      } else {
        await Promise.all(
          matchedServices.map((service) =>
            API.delete(`/services/${service._id}`)
          )
        );

        await loadServices();
      }
    } else {
      setServices((current) =>
        current.filter(
          (service) =>
            !(
              service.category === category &&
              service.subcategory === subcategory
            )
        )
      );
    }

    persistSubcategories({
      ...subcategoryOptions,
      [category]: (
        subcategoryOptions[category] || []
      ).filter((item) => item !== subcategory),
    });
  };

  const handleServiceFormChange = (e) => {
    const { name, value } = e.target;

    setServiceForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "category"
        ? { subcategory: "" }
        : {}),
    }));
  };

  const resetServiceForm = () => {
    setServiceForm(emptyServiceForm);
    setEditingServiceId("");
  };

  const saveLocalService = (payload) => {
    const currentLocalServices = readJson(
      storageKeys.services,
      []
    );
    let nextLocalServices;

    if (editingServiceId) {
      nextLocalServices = currentLocalServices.map((service) =>
        service._id === editingServiceId
          ? { ...service, ...payload, localOnly: true }
          : service
      );

      if (
        !nextLocalServices.some(
          (service) => service._id === editingServiceId
        )
      ) {
        nextLocalServices = [
          {
            _id: editingServiceId,
            ...payload,
            localOnly: true,
          },
          ...nextLocalServices,
        ];
      }

      setServices((current) =>
        current.map((service) =>
          service._id === editingServiceId
            ? {
                ...service,
                ...payload,
                localOnly: service.localOnly ?? true,
              }
            : service
        )
      );
    } else {
      const newService = {
        _id: `local-service-${Date.now()}`,
        ...payload,
        localOnly: true,
      };
      nextLocalServices = [
        newService,
        ...currentLocalServices,
      ];

      setServices((current) => [
        newService,
        ...current,
      ]);
    }

    localStorage.setItem(
      storageKeys.services,
      JSON.stringify(nextLocalServices)
    );
    resetServiceForm();
    setMessage(
      "Service saved locally. Connect the backend to persist it permanently."
    );
  };

  const handleSaveService = async (e) => {
    e.preventDefault();

    const payload = {
      name: serviceForm.name.trim(),
      category: serviceForm.category.trim(),
      subcategory: serviceForm.subcategory.trim(),
      price: Number(serviceForm.price),
    };

    if (
      !payload.name ||
      !payload.category ||
      !payload.subcategory ||
      Number.isNaN(payload.price)
    ) {
      setMessage(
        "Fill service name, category, subcategory, and price."
      );
      return;
    }

    const editingService = services.find(
      (service) => service._id === editingServiceId
    );

    if (!serviceApiReady || editingService?.localOnly) {
      saveLocalService(payload);
      return;
    }

    if (editingServiceId) {
      await API.put(`/services/${editingServiceId}`, payload);
    } else {
      await API.post("/services", payload);
    }

    resetServiceForm();
    await loadServices();
  };

  const handleEditService = (service) => {
    setEditingServiceId(service._id);
    setServiceForm({
      name: service.name,
      category: service.category,
      subcategory: service.subcategory,
      price: service.price,
    });
  };

  const handleDeleteService = async (service) => {
    if (!window.confirm(`Delete ${service.name}?`)) {
      return;
    }

    if (!serviceApiReady || service.localOnly) {
      setServices((current) =>
        current.filter((item) => item._id !== service._id)
      );
      localStorage.setItem(
        storageKeys.services,
        JSON.stringify(
          readJson(storageKeys.services, []).filter(
            (item) => item._id !== service._id
          )
        )
      );
      return;
    }

    await API.delete(`/services/${service._id}`);
    await loadServices();
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    const name = staffName.trim();

    if (!name) {
      return;
    }

    if (editingStaff) {
      persistStaff(
        staffList.map((staff) =>
          staff === editingStaff ? name : staff
        )
      );
      setEditingStaff("");
    } else if (!staffList.includes(name)) {
      persistStaff([...staffList, name].sort());
    }

    setStaffName("");
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffName(staff);
  };

  const handleDeleteStaff = (staff) => {
    if (!window.confirm(`Delete staff ${staff}?`)) {
      return;
    }

    persistStaff(
      staffList.filter((person) => person !== staff)
    );
  };

  const staffPerformance = Object.entries(staffStats)
    .sort(([, a], [, b]) => b.services - a.services)
    .map(([staff, data]) => ({
      staff,
      services: data.services,
      activeDays: data.activeDays,
    }));

  const pageTitles = {
    dashboard: "Dashboard",
    services: "Services",
    staff: "Staff",
    transactions: "Transactions",
    categories: "Categories",
  };
  const navItems = [
    ["dashboard", "Dashboard"],
    ["services", "Services"],
    ["staff", "Staff"],
    ["transactions", "Transactions"],
    ["categories", "Categories"],
  ];

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>Salon Admin Panel</div>

        <nav style={styles.nav}>
          {navItems.map(([view, label]) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                ...styles.navLink,
                ...(activeView === view
                  ? styles.activeNavLink
                  : {}),
              }}
              type="button"
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            style={styles.navButton}
            type="button"
          >
            Logout
          </button>
        </nav>

        <div style={styles.quickActions}>
          <h2 style={styles.sidebarTitle}>Quick Actions</h2>
          <button
            onClick={() => setActiveView("services")}
            style={styles.quickLink}
            type="button"
          >
            + Add Service
          </button>
          <button
            onClick={() => setActiveView("staff")}
            style={styles.quickLink}
            type="button"
          >
            + Add Staff
          </button>
          <button
            onClick={() => setActiveView("transactions")}
            style={styles.quickLink}
            type="button"
          >
            + Transaction
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <p style={styles.eyebrow}>Welcome Admin</p>
            <h1 style={styles.title}>
              {pageTitles[activeView]}
            </h1>
          </div>

          <button
            onClick={handleLogout}
            style={styles.dangerButton}
            type="button"
          >
            Logout
          </button>
        </header>

        {message && (
          <div style={styles.notice}>{message}</div>
        )}

        {activeView === "dashboard" && (
          <section style={styles.sectionBlock}>
            <div style={styles.dateFilterRow}>
              <label style={styles.dateLabel}>
                Filter by date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(e.target.value)
                }
                style={styles.dateInput}
              />
            </div>

            <h2 style={styles.sectionTitle}>
              Daily Activity — {selectedDate}
            </h2>
            <div style={styles.statsGrid}>
              <StatCard
                title="Transactions"
                value={filteredTransactions.length}
              />
              <StatCard
                title="Services Completed"
                value={dailyServicesCompleted}
              />
              <StatCard
                title="Staff Active"
                value={dailyStaffActive.size}
              />
              <StatCard
                title="All Time Revenue"
                value={`${totalRevenue} Birr`}
              />
            </div>

            <div style={styles.chartGrid}>
              <Panel title="Revenue Chart">
                <BarChart
                  items={[
                    {
                      label: "Total",
                      value: totalRevenue,
                    },
                    {
                      label: "Monthly",
                      value: monthRevenue,
                    },
                  ]}
                />
              </Panel>

              <Panel title="Staff Service Count">
                {staffPerformance.length === 0 ? (
                  <p style={styles.subtle}>No data</p>
                ) : (
                  <div style={styles.list}>
                    {staffPerformance.map((item) => (
                      <div
                        key={item.staff}
                        style={styles.performanceItem}
                      >
                        <span>{item.staff}</span>
                        <strong>
                          {item.services}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            {filteredTransactions.length > 0 && (
              <Panel title="Daily Transactions">
                <div style={styles.list}>
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx._id || tx.uuid || tx.createdAt}
                      style={styles.txItem}
                    >
                      <div>
                        <strong>
                          {tx.services
                            .map((s) => s.name)
                            .join(", ")}
                        </strong>
                        <small
                          style={styles.blockSubtle}
                        >
                          {new Date(
                            tx.createdAt
                          ).toLocaleTimeString()}{" "}
                          |{" "}
                          {tx.paymentType || "Payment"}
                        </small>
                      </div>
                      <span>
                        {tx.services.length} service
                        {tx.services.length > 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </section>
        )}

        {activeView === "services" && (
        <section style={styles.gridOne}>
          <Panel title="Services Management" id="services">
            <form
              onSubmit={handleSaveService}
              style={styles.formStack}
            >
              <input
                name="name"
                value={serviceForm.name}
                onChange={handleServiceFormChange}
                placeholder="Service Name"
                style={styles.input}
              />
              <select
                name="category"
                value={serviceForm.category}
                onChange={handleServiceFormChange}
                style={styles.input}
              >
                <option value="">Category</option>
                {serviceCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                name="subcategory"
                value={serviceForm.subcategory}
                onChange={handleServiceFormChange}
                style={styles.input}
                disabled={!serviceForm.category}
              >
                <option value="">Subcategory</option>
                {serviceSubcategories.map((subcategory) => (
                  <option
                    key={subcategory}
                    value={subcategory}
                  >
                    {subcategory}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                min="0"
                value={serviceForm.price}
                onChange={handleServiceFormChange}
                placeholder="Price"
                style={styles.input}
              />
              <div style={styles.inlineActions}>
                <button style={styles.primaryButton}>
                  {editingServiceId
                    ? "Update Service"
                    : "Add Service"}
                </button>
                {editingServiceId && (
                  <button
                    type="button"
                    onClick={resetServiceForm}
                    style={styles.secondaryButton}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div style={styles.compactList}>
              {servicesLoading ? (
                <p style={styles.subtle}>
                  Loading services...
                </p>
              ) : (
                services.map((service) => (
                  <div
                    key={service._id}
                    style={styles.compactItem}
                  >
                    <div>
                      <strong>{service.name}</strong>
                      <small style={styles.blockSubtle}>
                        {service.category} /{" "}
                        {service.subcategory}
                      </small>
                    </div>
                    <div style={styles.inlineActions}>
                      <strong>{service.price} Birr</strong>
                      <button
                        type="button"
                        onClick={() =>
                          handleEditService(service)
                        }
                        style={styles.smallButton}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteService(service)
                        }
                        style={styles.smallDangerButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>
        )}

        {activeView === "categories" && (
        <section style={styles.gridOne}>
          <Panel title="Categories" id="categories">
            <form
              onSubmit={handleAddCategory}
              style={styles.row}
            >
              <input
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value)
                }
                placeholder="Category name"
                style={styles.input}
              />
              <button style={styles.primaryButton}>
                Add
              </button>
            </form>

            <form
              onSubmit={handleAddSubcategory}
              style={styles.formGrid}
            >
              <select
                value={newSubcategory.category}
                onChange={(e) =>
                  setNewSubcategory((current) => ({
                    ...current,
                    category: e.target.value,
                  }))
                }
                style={styles.input}
              >
                <option value="">Category</option>
                {serviceCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={newSubcategory.name}
                onChange={(e) =>
                  setNewSubcategory((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                placeholder="Subcategory name"
                style={styles.input}
              />
              <button style={styles.primaryButton}>
                Add Subcategory
              </button>
            </form>

            <div style={styles.categoryTree}>
              {serviceCategories.map((category) => (
                <div
                  key={category}
                  style={styles.categoryNode}
                >
                  <div style={styles.categoryHeader}>
                    {editingCategory === category ? (
                      <input
                        value={categoryEditValue}
                        onChange={(e) =>
                          setCategoryEditValue(
                            e.target.value
                          )
                        }
                        style={styles.compactInput}
                      />
                    ) : (
                      <strong>{category}</strong>
                    )}

                    <div style={styles.inlineActions}>
                      {editingCategory === category ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleRenameCategory(category)
                          }
                          style={styles.smallButton}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryEditValue(category);
                          }}
                          style={styles.smallButton}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteCategory(category)
                        }
                        style={styles.smallDangerButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {(categorySubcategories[category] || []).map(
                    (subcategory) => {
                      const isEditing =
                        editingSubcategory?.category ===
                          category &&
                        editingSubcategory?.name ===
                          subcategory;

                      return (
                        <div
                          key={`${category}-${subcategory}`}
                          style={styles.subcategoryRow}
                        >
                          {isEditing ? (
                            <input
                              value={subcategoryEditValue}
                              onChange={(e) =>
                                setSubcategoryEditValue(
                                  e.target.value
                                )
                              }
                              style={styles.compactInput}
                            />
                          ) : (
                            <span>|-- {subcategory}</span>
                          )}
                          <div style={styles.inlineActions}>
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRenameSubcategory(
                                    category,
                                    subcategory
                                  )
                                }
                                style={styles.smallButton}
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubcategory({
                                    category,
                                    name: subcategory,
                                  });
                                  setSubcategoryEditValue(
                                    subcategory
                                  );
                                }}
                                style={styles.smallButton}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteSubcategory(
                                  category,
                                  subcategory
                                )
                              }
                              style={styles.smallDangerButton}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </section>
        )}

        {activeView === "transactions" && (
        <section style={styles.gridOne}>
          <Panel
            title="Sales History"
            id="transactions"
          >
            {loading ? (
              <p style={styles.subtle}>Loading...</p>
            ) : error ? (
              <p style={styles.notice}>{error}</p>
            ) : validTransactions.length === 0 ? (
              <p style={styles.subtle}>
                No transactions found
              </p>
            ) : (
              <div style={styles.list}>
                {validTransactions.map((tx) => (
                  <div
                    key={tx._id || tx.uuid || tx.createdAt}
                    style={styles.txItem}
                  >
                    <div>
                      <strong>{tx.total} Birr</strong>
                      <small style={styles.blockSubtle}>
                        {new Date(
                          tx.createdAt
                        ).toLocaleString()}{" "}
                        | {tx.paymentType || "Payment"}
                      </small>
                    </div>
                    <span>
                      {tx.services.length} services
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </section>
        )}

        {activeView === "staff" && (
        <>
        <Panel title="Staff Performance">
          {staffPerformance.length === 0 ? (
            <p style={styles.subtle}>No staff data</p>
          ) : (
            <div style={styles.list}>
              {staffPerformance.map((item) => (
                <div
                  key={item.staff}
                  style={styles.performanceItem}
                >
                  <div>
                    <strong>{item.staff}</strong>
                    <small style={styles.blockSubtle}>
                      {item.services} service
                      {item.services !== 1
                        ? "s"
                        : ""} completed
                    </small>
                    <small
                      style={{
                        ...styles.blockSubtle,
                        color: "#a3a3a3",
                      }}
                    >
                      {item.activeDays} day
                      {item.activeDays !== 1
                        ? "s"
                        : ""} active
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Staff Management" id="staff">
          <form
            onSubmit={handleSaveStaff}
            style={styles.staffForm}
          >
            <input
              value={staffName}
              onChange={(e) =>
                setStaffName(e.target.value)
              }
              placeholder="Staff name"
              style={styles.input}
            />
            <button style={styles.primaryButton}>
              {editingStaff ? "Update Staff" : "Add Staff"}
            </button>
          </form>

          <div style={styles.staffGrid}>
            {staffList.map((staff) => (
              <div key={staff} style={styles.staffItem}>
                <strong>{staff}</strong>
                <div style={styles.inlineActions}>
                  <button
                    type="button"
                    onClick={() => handleEditStaff(staff)}
                    style={styles.smallButton}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteStaff(staff)
                    }
                    style={styles.smallDangerButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        </>
        )}
      </main>
    </div>
  );
}

function Panel({ title, children, id }) {
  return (
    <section id={id} style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.subtle}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

function BarChart({ items }) {
  const maxValue = Math.max(
    ...items.map((item) => Number(item.value) || 0),
    1
  );

  if (items.length === 0) {
    return <p style={styles.subtle}>No chart data</p>;
  }

  return (
    <div style={styles.chart}>
      {items.map((item) => {
        const value = Number(item.value) || 0;
        const width = `${Math.max(
          (value / maxValue) * 100,
          value > 0 ? 6 : 0
        )}%`;

        return (
          <div key={item.label} style={styles.chartRow}>
            <div style={styles.chartLabel}>{item.label}</div>
            <div style={styles.chartTrack}>
              <div
                style={{
                  ...styles.chartBar,
                  width,
                }}
              />
            </div>
            <strong style={styles.chartValue}>
              {value} Birr
            </strong>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "220px minmax(0, 1fr)",
    background: "#101010",
    color: "#f3f4f6",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
    textAlign: "left",
  },
  sidebar: {
    position: "sticky",
    top: 0,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#171717",
    color: "#f9fafb",
    borderRight: "1px solid #2f2f2f",
  },
  brand: {
    padding: "22px 18px",
    borderBottom: "1px solid #2f2f2f",
    textTransform: "uppercase",
    fontWeight: 800,
    fontSize: "15px",
    letterSpacing: 0,
  },
  nav: {
    display: "grid",
    gap: "4px",
    padding: "18px 12px",
  },
  navLink: {
    width: "100%",
    color: "#cfcfcf",
    background: "transparent",
    border: "0",
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
  },
  activeNavLink: {
    background: "#2d2d2d",
    color: "#ffffff",
    boxShadow: "inset 3px 0 0 #d4af37",
  },
  navButton: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    background: "transparent",
    color: "#cfcfcf",
    border: "0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  quickActions: {
    marginTop: "auto",
    padding: "18px 12px 22px",
    borderTop: "1px solid #2f2f2f",
  },
  sidebarTitle: {
    margin: "0 0 12px",
    color: "#ffffff",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  quickLink: {
    display: "block",
    width: "100%",
    color: "#e5e7eb",
    background: "transparent",
    border: "0",
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "left",
    cursor: "pointer",
  },
  main: {
    minWidth: 0,
    padding: "0 28px 32px",
  },
  topbar: {
    minHeight: "78px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    margin: "0 -28px 24px",
    padding: "0 28px",
    background: "#1a1a1a",
    borderBottom: "1px solid #303030",
  },
  eyebrow: {
    margin: 0,
    color: "#b8b8b8",
    fontWeight: 700,
  },
  title: {
    margin: "4px 0 0",
    color: "#ffffff",
    fontSize: "22px",
    letterSpacing: 0,
  },
  sectionBlock: {
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: "0 0 12px",
    color: "#ffffff",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  panel: {
    background: "#1b1b1b",
    border: "1px solid #333333",
    borderRadius: "8px",
    padding: "18px",
    marginBottom: "18px",
    boxShadow: "0 14px 28px rgba(0, 0, 0, 0.35)",
  },
  panelTitle: {
    margin: "0 0 14px",
    paddingBottom: "10px",
    color: "#f3f4f6",
    borderBottom: "1px solid #333333",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "0",
    overflow: "hidden",
    background: "#1b1b1b",
    border: "1px solid #333333",
    borderRadius: "8px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(0, 1fr)",
    gap: "18px",
  },
  gridOne: {
    display: "grid",
    gap: "18px",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(0, 1fr)",
    gap: "18px",
    marginTop: "18px",
  },
  dateFilterRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  dateLabel: {
    color: "#cfcfcf",
    fontSize: "14px",
    fontWeight: 600,
  },
  dateInput: {
    minHeight: "38px",
    padding: "8px 12px",
    background: "#111111",
    color: "#f5f5f5",
    border: "1px solid #3f3f3f",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },
  statCard: {
    background: "#1b1b1b",
    borderRight: "1px solid #333333",
    padding: "18px",
  },
  statValue: {
    margin: "8px 0 0",
    color: "#ffffff",
    fontSize: "24px",
    lineHeight: 1.1,
    letterSpacing: 0,
  },
  formStack: {
    display: "grid",
    gap: "10px",
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(0, 1fr) auto",
    gap: "10px",
    alignItems: "center",
    marginTop: "10px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "center",
  },
  input: {
    width: "100%",
    minHeight: "42px",
    padding: "10px 12px",
    boxSizing: "border-box",
    background: "#111111",
    color: "#f5f5f5",
    border: "1px solid #3f3f3f",
    borderRadius: "6px",
    outline: "none",
    fontSize: "14px",
  },
  compactInput: {
    width: "100%",
    minHeight: "34px",
    padding: "8px 10px",
    boxSizing: "border-box",
    background: "#111111",
    color: "#f5f5f5",
    border: "1px solid #3f3f3f",
    borderRadius: "6px",
  },
  primaryButton: {
    minHeight: "42px",
    padding: "10px 14px",
    background: "#d4af37",
    color: "#111111",
    border: "1px solid #d4af37",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  secondaryButton: {
    minHeight: "42px",
    padding: "10px 14px",
    background: "#242424",
    color: "#f5f5f5",
    border: "1px solid #444444",
    borderRadius: "6px",
    cursor: "pointer",
  },
  dangerButton: {
    minHeight: "42px",
    padding: "10px 16px",
    background: "#7f1d1d",
    color: "#fff",
    border: "1px solid #991b1b",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
  },
  smallButton: {
    padding: "7px 10px",
    background: "#242424",
    color: "#f5f5f5",
    border: "1px solid #444444",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  smallDangerButton: {
    padding: "7px 10px",
    background: "#421818",
    color: "#fecaca",
    border: "1px solid #7f1d1d",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  list: {
    display: "grid",
    gap: "10px",
  },
  compactList: {
    display: "grid",
    gap: "8px",
  },
  compactItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderTop: "1px solid #303030",
  },
  txItem: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#111111",
    border: "1px solid #303030",
    borderRadius: "8px",
  },
  performanceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#111111",
    border: "1px solid #303030",
    borderRadius: "8px",
  },
  categoryTree: {
    display: "grid",
    gap: "10px",
    marginTop: "14px",
  },
  categoryNode: {
    padding: "12px",
    background: "#111111",
    border: "1px solid #303030",
    borderRadius: "8px",
  },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  subcategoryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "9px",
    paddingLeft: "16px",
    color: "#cfcfcf",
  },
  staffForm: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) auto",
    gap: "10px",
    alignItems: "center",
    marginBottom: "14px",
  },
  staffGrid: {
    display: "grid",
    gap: "10px",
  },
  staffItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#111111",
    border: "1px solid #303030",
    borderRadius: "8px",
  },
  inlineActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chart: {
    display: "grid",
    gap: "14px",
  },
  chartRow: {
    display: "grid",
    gridTemplateColumns: "110px minmax(0, 1fr) 90px",
    gap: "12px",
    alignItems: "center",
  },
  chartLabel: {
    color: "#e5e5e5",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  chartTrack: {
    height: "14px",
    overflow: "hidden",
    background: "#0b0b0b",
    border: "1px solid #333333",
    borderRadius: "6px",
  },
  chartBar: {
    height: "100%",
    background:
      "linear-gradient(90deg, #d4af37, #f4d36a)",
    borderRadius: "6px",
  },
  chartValue: {
    color: "#f5d679",
    fontSize: "12px",
    textAlign: "right",
  },
  subtle: {
    margin: 0,
    color: "#a3a3a3",
    fontSize: "14px",
  },
  blockSubtle: {
    display: "block",
    marginTop: "4px",
    color: "#a3a3a3",
    fontSize: "12px",
  },
  notice: {
    padding: "12px 14px",
    background: "#2b2414",
    border: "1px solid #6b5520",
    borderRadius: "8px",
    color: "#f5d679",
    marginBottom: "18px",
  },
};
