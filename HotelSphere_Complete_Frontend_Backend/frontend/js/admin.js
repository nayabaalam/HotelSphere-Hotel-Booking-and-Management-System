
/* =====================================================
   HOTELSPHERE - ADMIN PANEL
   File: frontend/js/admin.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. ELEMENT SELECTORS
    // -------------------------------------------------

    const sidebarToggle = document.getElementById("sidebarToggle");
    const adminSidebar = document.getElementById("adminSidebar");

    const tableSearch = document.getElementById("tableSearch");
    const tableFilter = document.getElementById("tableStatusFilter");

    const selectAll = document.getElementById("selectAll");

    const deleteSelectedButton =
        document.getElementById("deleteSelected");

    const exportButton =
        document.getElementById("exportTable");

    const adminNotification =
        document.getElementById("adminNotification");


    // -------------------------------------------------
    // 2. ADMIN NOTIFICATION
    // -------------------------------------------------

    function showAdminNotification(message, type = "success") {

        if (!adminNotification) {
            alert(message);
            return;
        }

        adminNotification.textContent = message;

        adminNotification.className =
            "admin-notification " + type;

        adminNotification.style.display = "block";

        clearTimeout(showAdminNotification.timer);

        showAdminNotification.timer = setTimeout(function () {

            adminNotification.style.display = "none";

        }, 3500);

    }


    // -------------------------------------------------
    // 3. SIDEBAR TOGGLE
    // -------------------------------------------------

    if (sidebarToggle && adminSidebar) {

        sidebarToggle.addEventListener("click", function () {

            adminSidebar.classList.toggle("collapsed");

            document.body.classList.toggle("sidebar-collapsed");

        });

    }


    // -------------------------------------------------
    // 4. GET TABLE ROWS
    // -------------------------------------------------

    function getTableRows() {

        const tables = document.querySelectorAll(
            ".admin-table, #adminTable, table"
        );

        let rows = [];

        tables.forEach(function (table) {

            const bodyRows = table.querySelectorAll("tbody tr");

            bodyRows.forEach(function (row) {

                rows.push(row);

            });

        });

        return rows;

    }


    // -------------------------------------------------
    // 5. SEARCH TABLE
    // -------------------------------------------------

    function filterAdminTable() {

        const searchText = tableSearch
            ? tableSearch.value.trim().toLowerCase()
            : "";

        const selectedStatus = tableFilter
            ? tableFilter.value.toLowerCase()
            : "all";

        const rows = getTableRows();

        rows.forEach(function (row) {

            const rowText = row.textContent.toLowerCase();

            const statusElement = row.querySelector(
                "[data-status], .status-badge, .badge"
            );

            const rowStatus = statusElement
                ? (
                    statusElement.dataset.status ||
                    statusElement.textContent
                ).trim().toLowerCase()
                : "";

            const matchesSearch =
                rowText.includes(searchText);

            const matchesStatus =
                selectedStatus === "all" ||
                rowStatus.includes(selectedStatus);

            row.style.display =
                matchesSearch && matchesStatus ? "" : "none";

        });

    }

    if (tableSearch) {

        tableSearch.addEventListener(
            "input",
            filterAdminTable
        );

    }

    if (tableFilter) {

        tableFilter.addEventListener(
            "change",
            filterAdminTable
        );

    }


    // -------------------------------------------------
    // 6. SELECT ALL CHECKBOXES
    // -------------------------------------------------

    function getRowCheckboxes() {

        return Array.from(
            document.querySelectorAll(
                ".row-checkbox, .admin-row-checkbox"
            )
        );

    }

    if (selectAll) {

        selectAll.addEventListener("change", function () {

            getRowCheckboxes().forEach(function (checkbox) {

                const row = checkbox.closest("tr");

                if (row && row.style.display === "none") {
                    return;
                }

                checkbox.checked = selectAll.checked;

            });

        });

    }


    // Update Select All when individual checkbox changes

    document.addEventListener("change", function (event) {

        if (
            event.target.matches(
                ".row-checkbox, .admin-row-checkbox"
            )
        ) {

            const checkboxes = getRowCheckboxes();

            const visibleCheckboxes = checkboxes.filter(
                function (checkbox) {

                    const row = checkbox.closest("tr");

                    return !row || row.style.display !== "none";

                }
            );

            if (selectAll) {

                selectAll.checked =
                    visibleCheckboxes.length > 0 &&
                    visibleCheckboxes.every(
                        checkbox => checkbox.checked
                    );

                selectAll.indeterminate =
                    visibleCheckboxes.some(
                        checkbox => checkbox.checked
                    ) && !selectAll.checked;

            }

        }

    });


    // -------------------------------------------------
    // 7. DELETE SELECTED ROWS
    // -------------------------------------------------

    if (deleteSelectedButton) {

        deleteSelectedButton.addEventListener(
            "click",
            function () {

                const selectedCheckboxes =
                    getRowCheckboxes().filter(
                        checkbox => checkbox.checked
                    );

                if (selectedCheckboxes.length === 0) {

                    showAdminNotification(
                        "Please select at least one row.",
                        "warning"
                    );

                    return;

                }

                const confirmed = confirm(
                    "Are you sure you want to remove the selected rows from this page?"
                );

                if (!confirmed) {
                    return;
                }

                selectedCheckboxes.forEach(function (checkbox) {

                    const row = checkbox.closest("tr");

                    if (row) {
                        row.remove();
                    }

                });

                if (selectAll) {
                    selectAll.checked = false;
                    selectAll.indeterminate = false;
                }

                showAdminNotification(
                    "Selected rows removed from the current view.",
                    "success"
                );

            }
        );

    }


    // -------------------------------------------------
    // 8. SORT TABLE COLUMNS
    // -------------------------------------------------

    const sortableHeaders = document.querySelectorAll(
        "th[data-sort]"
    );

    sortableHeaders.forEach(function (header) {

        header.style.cursor = "pointer";

        header.addEventListener("click", function () {

            const table = header.closest("table");

            if (!table) {
                return;
            }

            const tbody = table.querySelector("tbody");

            if (!tbody) {
                return;
            }

            const columnIndex = Array.from(
                header.parentElement.children
            ).indexOf(header);

            const ascending =
                header.dataset.direction !== "asc";

            const rows = Array.from(tbody.querySelectorAll("tr"));

            rows.sort(function (rowA, rowB) {

                const valueA =
                    rowA.children[columnIndex]?.textContent.trim() || "";

                const valueB =
                    rowB.children[columnIndex]?.textContent.trim() || "";

                const numberA = Number(
                    valueA.replace(/[₹,$,\s]/g, "")
                );

                const numberB = Number(
                    valueB.replace(/[₹,$,\s]/g, "")
                );

                if (
                    valueA !== "" &&
                    valueB !== "" &&
                    !Number.isNaN(numberA) &&
                    !Number.isNaN(numberB)
                ) {

                    return ascending
                        ? numberA - numberB
                        : numberB - numberA;

                }

                return ascending
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);

            });

            rows.forEach(function (row) {

                tbody.appendChild(row);

            });

            sortableHeaders.forEach(function (otherHeader) {

                delete otherHeader.dataset.direction;

            });

            header.dataset.direction =
                ascending ? "asc" : "desc";

        });

    });


    // -------------------------------------------------
    // 9. EXPORT TABLE TO CSV
    // -------------------------------------------------

    function exportTableToCSV() {

        const table =
            document.querySelector(
                ".admin-table, #adminTable, table"
            );

        if (!table) {

            showAdminNotification(
                "No table found to export.",
                "warning"
            );

            return;

        }

        const rows = Array.from(table.querySelectorAll("tr"));

        const csvData = rows
            .filter(function (row) {

                return row.style.display !== "none";

            })
            .map(function (row) {

                return Array.from(row.querySelectorAll("th, td"))
                    .filter(function (cell) {

                        return !cell.classList.contains(
                            "action-column"
                        );

                    })
                    .map(function (cell) {

                        let value = cell.innerText
                            .replace(/\s+/g, " ")
                            .trim();

                        // Protect CSV from formula injection
                        if (/^[=+\-@\t\r]/.test(value)) {
                            value = "'" + value;
                        }

                        return '"' +
                            value.replace(/"/g, '""') +
                            '"';

                    })
                    .join(",");

            })
            .join("\n");

        const blob = new Blob(
            ["\uFEFF" + csvData],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            "HotelSphere_Admin_Export.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        showAdminNotification(
            "CSV file exported successfully.",
            "success"
        );

    }

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportTableToCSV
        );

    }


    // -------------------------------------------------
    // 10. INITIALIZE ADMIN PANEL
    // -------------------------------------------------

    filterAdminTable();

    console.log(
        "HotelSphere Admin Panel initialized successfully."
    );

});
