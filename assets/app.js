
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        let selectedDateStr = '';
        let fullDataCache = null;

        function pad(n) {
            return String(n).padStart(2, '0');
        }

        function daysInMonth(month, year) {
            return new Date(year, month + 1, 0).getDate();
        }

        function updateTitle(title) {
            document.getElementById('title').innerText = title;
            document.title = title;
        }

        function formatNumber(number, onlyLast2) {
            if (!number) return '';
            return onlyLast2 ? number.toString().slice(-2) : number;
        }

        function renderTable(data, onlyLast2) {
            const regions = data.regions;
            const prizes = data.prizes;

            const headerRow = document.getElementById('tableHeader');
            headerRow.innerHTML = '';
            const prizeHeader = document.createElement('th');
            prizeHeader.textContent = 'Giải';
            headerRow.appendChild(prizeHeader);

            regions.forEach(region => {
                const th = document.createElement('th');
                th.textContent = region;
                headerRow.appendChild(th);
            });

            const tbody = document.getElementById('resultBody');
            tbody.innerHTML = '';

            for (const prizeName in prizes) {
                const row = document.createElement('tr');
                if (prizeName === "Đặc biệt") row.classList.add('special');

                const prizeCell = document.createElement('td');
                prizeCell.textContent = prizeName;
                row.appendChild(prizeCell);

                regions.forEach(region => {
                    const cell = document.createElement('td');
                    const prizeData = prizes[prizeName];
                    const value = prizeData && prizeData[region] ? formatNumber(prizeData[region], onlyLast2) : '';
                    cell.innerHTML = `<span class="number-cell">${value}</span>`;
                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            }
        }

        function searchNumber() {
            const province = document.getElementById('provinceSelect').value;
            const number = document.getElementById('searchNumber').value;
            document.getElementById('modal').style.display = 'none';

            if (!number || number.length !== 6 || !/^[0-9]{6}$/.test(number)) {
                showAlert('Vui lòng nhập đúng 6 chữ số.');
                return;
            }

            let found = false;
            const spans = document.querySelectorAll('tbody tr');

            spans.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) return;
                const regionIndex = Array.from(cells).findIndex((cell, idx) => idx > 0 && fullDataCache.regions[idx - 1] === province);
                if (regionIndex !== -1) {
                    const span = cells[regionIndex].querySelector('.number-cell');
                    if (!span) return;
                    const value = span.innerText.trim();

                    for (let i = 2; i <= 6; i++) {
                        if (value.slice(-i) === number.slice(-i)) {
                            cells[regionIndex].classList.add('highlight');
                            found = true;
                            showAlert(`Chúc mừng bạn đã trúng <b>${cells[0].textContent}</b> số <b class="red">${value}</b>`);
                            break;
                        }
                    }
                }
            });

            if (!found) showAlert('Không trúng thưởng.');
        }

        function loadData(dateStr) {
            selectedDateStr = dateStr;
            const url = `data/kqxs_${dateStr}.json`;
            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error("Kết quả xổ số đang được cập nhật.");
                    return res.json();
                })
                .then(data => {
                    fullDataCache = data;
                    updateTitle(data.title);
                    const onlyLast2 = document.getElementById('lastTwoCheckbox').checked;
                    renderTable(data, onlyLast2);
                    const provinceSelect = document.getElementById('provinceSelect');
                    provinceSelect.innerHTML = '';
                    data.regions.forEach(r => {
                        const opt = document.createElement('option');
                        opt.value = r;
                        opt.textContent = r;
                        provinceSelect.appendChild(opt);
                    });

                    highlightSelectedDate();
                })
                .catch(err => {
                    updateTitle('Không thể tải dữ liệu');
                    document.getElementById('tableHeader').innerHTML = '';
                    document.getElementById('resultBody').innerHTML = '';
                    console.error(err);
                });
        }

        function highlightSelectedDate() {
            document.querySelectorAll('.day-selector button').forEach(btn => {
                if (btn.dataset.date === selectedDateStr) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }

        function updateDayButtons(monthIndex, year) {
            const dayContainer = document.getElementById('daySelector');
            dayContainer.innerHTML = '';

            let totalDays = daysInMonth(monthIndex, year);
            if (year === currentYear && monthIndex === currentMonth) {
                totalDays = currentDay;
            }

            for (let d = 1; d <= totalDays; d++) {
                const btn = document.createElement('button');
                btn.textContent = pad(d);
                const fullDate = `${pad(d)}-${pad(monthIndex + 1)}-${year}`;
                btn.dataset.date = fullDate;
                btn.onclick = () => {
                    loadData(fullDate);
                };
                dayContainer.appendChild(btn);
            }

            loadData(`01-${pad(monthIndex + 1)}-${year}`);
        }

        function createMonthOptions(selectedMonth = currentMonth) {
            const select = document.getElementById('monthSelect');
            select.innerHTML = '';
            const maxMonth = (document.getElementById('yearSelect')?.value == currentYear) ? currentMonth : 11;
            for (let m = 0; m <= maxMonth; m++) {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = `Tháng ${m + 1}`;
                if (m === selectedMonth) opt.selected = true;
                select.appendChild(opt);
            }
        }

        function createYearOptions(selectedYear = currentYear) {
            const select = document.getElementById('yearSelect');
            select.innerHTML = '';
            const years = [currentYear - 1, currentYear];
            years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                if (y === selectedYear) opt.selected = true;
                select.appendChild(opt);
            });
        }

        function showAlert(message, duration = 2500) {
            const box = document.getElementById('alertBox');
            const content = document.getElementById('alertContent');
            content.innerHTML = message;
            box.style.display = 'flex';

            // setTimeout(() => {
            //     box.style.display = 'none';
            // }, duration);
        }

        function init() {
            createYearOptions();
            createMonthOptions();

            const monthSelect = document.getElementById('monthSelect');
            const yearSelect = document.getElementById('yearSelect');

            function refresh() {
                const y = parseInt(yearSelect.value);
                createMonthOptions(parseInt(monthSelect.value));
                const m = parseInt(monthSelect.value);
                updateDayButtons(m, y);
            }

            monthSelect.addEventListener('change', refresh);
            yearSelect.addEventListener('change', refresh);

            document.getElementById('todayBtn').addEventListener('click', () => {
                yearSelect.value = currentYear;
                createMonthOptions(currentMonth);
                monthSelect.value = currentMonth;
                updateDayButtons(currentMonth, currentYear);
                loadData(`${pad(currentDay)}-${pad(currentMonth + 1)}-${currentYear}`);
            });

            document.getElementById('lastTwoCheckbox').addEventListener('change', () => {
                if (fullDataCache) {
                    const onlyLast2 = document.getElementById('lastTwoCheckbox').checked;
                    renderTable(fullDataCache, onlyLast2);
                }
            });

            document.getElementById('printMode').addEventListener('change', () => {
                if (fullDataCache) {
                   document.getElementsByClassName('container')[0].classList.toggle('print', document.getElementById('printMode').checked);
                }
            });

            document.getElementById('modal').addEventListener('click', function (e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
            document.getElementById('alertBox').addEventListener('click', function (e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });

            updateDayButtons(currentMonth, currentYear);
            loadData(`${pad(currentDay)}-${pad(currentMonth + 1)}-${currentYear}`);
        }

        init();