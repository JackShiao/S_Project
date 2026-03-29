const marketData = [
    { name: "台灣加權指數", value: "17,500.12", change: "+0.21%" },
    { name: "S&P500", value: "6,812.63", change: "-0.53%" },
    { name: "納斯達克指數", value: "23,275.92", change: "-0.38%" },
    { name: "道瓊工業指數", value: "47,289", change: "+5.6%" },
    { name: "日經225", value: "33,200.88", change: "-0.12%" }
];

function renderMarketTable() {
    let html = `<div class='table-responsive'>`;
    html += `<table class='table table-hover'>`;
    html += `<thead><tr><th>指數名稱</th><th>收盤指數</th><th>昨日漲跌幅</th></tr></thead><tbody>`;
    for (let i = 0; i < marketData.length; i++) {
        const item = marketData[i];
        let isUp = item.change.startsWith("+");
        let arrow = isUp
            ? `<i class="bi bi-caret-up-fill"></i>`
            : `<i class="bi bi-caret-down-fill"></i>`;
        let color = isUp ? "text-danger" : "text-success";
        html += `<tr><td>${item.name}</td><td>${item.value}</td><td class='${color}'>${arrow} ${item.change.replace('+', '').replace('-', '')}</td></tr>`;
    }
    html += `</tbody></table></div>`;
    document.getElementById("market-table-js").innerHTML = html;
}
renderMarketTable();