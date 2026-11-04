
/* =====================================================
   HOTELSPHERE - CUSTOMER MANAGEMENT
   File: frontend/js/customers.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const customerTableBody =
        document.getElementById("customersTableBody");

    const customerSearch =
        document.getElementById("customerSearch");

    const loyaltyFilter =
        document.getElementById("loyaltyFilter");

    const refreshButton =
        document.getElementById("refreshCustomers");

    const loadingMessage =
        document.getElementById("customersLoading");

    const errorMessage =
        document.getElementById("customersError");

    const emptyMessage =
        document.getElementById("customersEmpty");

    const totalCustomers =
        document.getElementById("totalCustomers");

    const goldCustomers =
        document.getElementById("goldCustomers");

    const silverCustomers =
        document.getElementById("silverCustomers");

    const regularCustomers =
        document.getElementById("regularCustomers");

    let allCustomers = [];


    // -------------------------------------------------
    // 2. HELPER FUNCTIONS
    // -------------------------------------------------

    function escapeHTML(value) {

        return String(value ?? "").replace(/[&<>"']/g, function (char) {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[char];

        });

    }

    function showMessage(element, message) {

        if (!element) return;

        element.textContent = message;
        element.style.display = "block";

    }

    function hideMessage(element) {

        if (!element) return;

        element.style.display = "none";

    }

    function normalizeTier(tier) {

        return String(tier || "REGULAR")
            .trim()
            .toUpperCase();

    }

    function getTierClass(tier) {

        const value = normalizeTier(tier);

        if (value === "GOLD") {
            return "gold";
        }

        if (value === "SILVER") {
            return "silver";
        }

        if (value === "PLATINUM") {
            return "platinum";
        }

        return "regular";

    }


    // -------------------------------------------------
    // 3. UPDATE CUSTOMER STATISTICS
    // -------------------------------------------------

    function updateStatistics(customers) {

        const total = customers.length;

        const gold = customers.filter(customer =>
            normalizeTier(customer.loyalty_tier) === "GOLD"
        ).length;

        const silver = customers.filter(customer =>
            normalizeTier(customer.loyalty_tier) === "SILVER"
        ).length;

        const regular = customers.filter(customer =>
            normalizeTier(customer.loyalty_tier) === "REGULAR"
        ).length;

        if (totalCustomers) {
            totalCustomers.textContent = total;
        }

        if (goldCustomers) {
            goldCustomers.textContent = gold;
        }

        if (silverCustomers) {
            silverCustomers.textContent = silver;
        }

        if (regularCustomers) {
            regularCustomers.textContent = regular;
        }

    }


    // -------------------------------------------------
    // 4. RENDER CUSTOMER TABLE
    // -------------------------------------------------

    function renderCustomers(customers) {

        if (!customerTableBody) return;

        customerTableBody.innerHTML = "";

        if (customers.length === 0) {

            showMessage(
                emptyMessage,
                "No customers found."
            );

            return;

        }

        hideMessage(emptyMessage);

        customers.forEach(function (customer) {

            const tier = normalizeTier(customer.loyalty_tier);

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHTML(customer.customer_id)}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(customer.full_name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(customer.email)}
                </td>

                <td>
                    ${escapeHTML(customer.phone)}
                </td>

                <td>
                    <span class="loyalty-badge ${getTierClass(tier)}">
                        ${escapeHTML(tier)}
                    </span>
                </td>

                <td>
                    ${Number(customer.loyalty_points) || 0}
                </td>

                <td class="action-column">

                    <button
                        type="button"
                        class="btn btn-sm btn-outline"
                        data-view-customer="${escapeHTML(customer.customer_id)}">

                        View Details

                    </button>

                </td>

            `;

            customerTableBody.appendChild(row);

        });

    }


    // -------------------------------------------------
    // 5. SEARCH AND FILTER CUSTOMERS
    // -------------------------------------------------

    function filterCustomers() {

        const searchText = customerSearch
            ? customerSearch.value.trim().toLowerCase()
            : "";

        const selectedTier = loyaltyFilter
            ? loyaltyFilter.value.toUpperCase()
            : "ALL";

        const filteredCustomers = allCustomers.filter(
            function (customer) {

                const matchesSearch = [

                    customer.customer_id,
                    customer.full_name,
                    customer.email,
                    customer.phone

                ].some(function (value) {

                    return String(value ?? "")
                        .toLowerCase()
                        .includes(searchText);

                });

                const matchesTier =
                    selectedTier === "ALL" ||
                    normalizeTier(customer.loyalty_tier) === selectedTier;

                return matchesSearch && matchesTier;

            }
        );

        renderCustomers(filteredCustomers);

    }

    if (customerSearch) {

        customerSearch.addEventListener(
            "input",
            filterCustomers
        );

    }

    if (loyaltyFilter) {

        loyaltyFilter.addEventListener(
            "change",
            filterCustomers
        );

    }


    // -------------------------------------------------
    // 6. VIEW CUSTOMER DETAILS
    // -------------------------------------------------

    if (customerTableBody) {

        customerTableBody.addEventListener(
            "click",
            function (event) {

                const button = event.target.closest(
                    "[data-view-customer]"
                );

                if (!button) return;

                const customerId = button.dataset.viewCustomer;

                const customer = allCustomers.find(
                    item =>
                        String(item.customer_id) === String(customerId)
                );

                if (!customer) return;

                alert(

                    "HOTELSPHERE CUSTOMER DETAILS\n\n" +

                    "Customer ID: " +
                    customer.customer_id + "\n\n" +

                    "Name: " +
                    customer.full_name + "\n\n" +

                    "Email: " +
                    customer.email + "\n\n" +

                    "Phone: " +
                    customer.phone + "\n\n" +

                    "Loyalty Tier: " +
                    customer.loyalty_tier + "\n\n" +

                    "Loyalty Points: " +
                    customer.loyalty_points

                );

            }
        );

    }


    // -------------------------------------------------
    // 7. LOAD CUSTOMERS FROM ORACLE API
    // -------------------------------------------------

    async function loadCustomers() {

        hideMessage(errorMessage);
        hideMessage(emptyMessage);

        showMessage(
            loadingMessage,
            "Loading customer records..."
        );

        if (refreshButton) {
            refreshButton.disabled = true;
        }

        try {

            if (
                !window.HSApi ||
                typeof window.HSApi.customers !== "function"
            ) {

                throw new Error(
                    "Customers API is not available. Check api.js."
                );

            }

            const response = await window.HSApi.customers();

            const customers = Array.isArray(response)
                ? response
                : response?.items;

            if (!Array.isArray(customers)) {

                throw new Error(
                    "Invalid customer data received from server."
                );

            }

            allCustomers = customers;

            updateStatistics(allCustomers);

            filterCustomers();

        } catch (error) {

            console.error(
                "Customer loading error:",
                error
            );

            showMessage(
                errorMessage,
                error.message || "Unable to load customers."
            );

        } finally {

            hideMessage(loadingMessage);

            if (refreshButton) {
                refreshButton.disabled = false;
            }

        }

    }


    // -------------------------------------------------
    // 8. REFRESH CUSTOMERS
    // -------------------------------------------------

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadCustomers
        );

    }


    // -------------------------------------------------
    // 9. INITIALIZE CUSTOMER MANAGEMENT
    // -------------------------------------------------

    if (customerTableBody) {

        loadCustomers();

    }

});
