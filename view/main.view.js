var orders = [];

const getDataOrders = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("allOrder", function (data) {
      const newOrders = data.allOrder.map((order) => {
        order.processing_info = {
          order_time: new Date(order.processing_info.order_time),
          payment_time: new Date(order.processing_info.payment_time),
          ship_time: new Date(order.processing_info.ship_time),
          completed_time: new Date(order.processing_info.completed_time),

          order_time_year: new Date(
            order.processing_info.order_time
          ).getFullYear(),

          payment_time_year: new Date(
            order.processing_info.payment_time
          ).getFullYear(),

          ship_time_year: new Date(
            order.processing_info.ship_time
          ).getFullYear(),

          completed_time_year: new Date(
            order.processing_info.completed_time
          ).getFullYear(),
        };
        return order;
      });
      return resolve(newOrders);
    });
  });
};

(async function main() {
  // get data from storage
  orders = await getDataOrders();
  console.log(orders);
  renderData();
})();

const formatterCurrency = (number) =>
  number.toLocaleString("it-IT", { style: "currency", currency: "VND" });

function renderData() {
  const lable = {};
  const processingInfos = [];

  orders.forEach((element) => {});

  renderSelectYear();

  renderCardOverviewByYear();

  const selectYear = document.getElementById("statistical-with-year");
  selectYear.addEventListener("change", (e) => {
    renderCardOverviewByYear(e.target.value);
    showChartPaymentByYear(e.target.value);
  });
}

const renderSelectYear = () => {
  // get all year from processingInfos.ship_time
  const years = new Set();
  orders.forEach((order) => {
    years.add(order.processing_info.order_time_year);
  });

  const selectYear = document.getElementById("statistical-with-year");

  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.innerText = year;
    selectYear.appendChild(option);
  });
  showChartPaymentByYear(years.values().next().value);
};

const renderCardOverviewByYear = (year) => {
  const payTotalElement = document.getElementById("pay-total");
  const quantityOrderSuccessElement = document.getElementById(
    "quantity-order-success"
  );
  const quantityPurchaseProductElement = document.getElementById(
    "quantity-purchase-product"
  );
  const shippingFeeTotalElement = document.getElementById("shipping-fee-total");

  const saveTotalElement = document.getElementById("save-total");

  const quantityOrderCancelElement = document.getElementById(
    "quantity-order-cancel"
  );
  const result = orders.reduce(
    (acc, order) => {
      if (!year || order.processing_info.order_time_year == year) {
        if (order.status == "label_order_cancelled") {
          acc.quantityOrderCancel++;
          return acc;
        }

        order.parcel?.forEach((parcel) => {
          acc.payTotal += checkNumber(parcel?.payment_info.total_price);
          acc.quantityOrderSuccess++;

          acc.shippingFeeTotal +=
            checkNumber(parcel?.payment_info.shipping) -
            checkNumber(parcel?.payment_info.shipping_discount_subtotal);

          acc.coins += checkNumber(parcel?.payment_info.coins);

          acc.saveTotal +=
            checkNumber(parcel?.payment_info.shipping_discount_subtotal) +
            checkNumber(parcel?.payment_info.shopee_voucher_applied) +
            checkNumber(parcel?.payment_info.shop_voucher_applied);

          parcel.itemsGroup.forEach((group) => {
            group.items.forEach((item) => {
              acc.quantityPurchaseProduct += checkNumber(item?.amount);
              order.items.push({
                itemId: item?.itemId,
                model_id: item?.model_id,
                name: item?.name,
                model_name: item?.model_name,
                image: item?.image,
                amount: item?.amount,
                item_price: item?.item_price,
                price_before_discount: item?.price_before_discount,
                order_price: item?.order_price,
              });
            });
          });
        });
      }
      return acc;
    },
    {
      payTotal: 0,
      quantityOrderSuccess: 0,
      quantityPurchaseProduct: 0,
      shippingFeeTotal: 0,
      saveTotal: 0,
      quantityOrderCancel: 0,
      coins: 0,
    }
  );

  payTotalElement.innerText = formatterCurrency(result.payTotal / 100000);
  quantityOrderSuccessElement.innerText = result.quantityOrderSuccess;
  quantityPurchaseProductElement.innerText = result.quantityPurchaseProduct;
  shippingFeeTotalElement.innerText = formatterCurrency(
    result.shippingFeeTotal / 100000
  );
  saveTotalElement.innerText = formatterCurrency(result.saveTotal / 100000);
  quantityOrderCancelElement.innerText = result.quantityOrderCancel;
};

// label_on_the_way
// label_order_cancelled
// label_order_completed
// label_preparing_order
function checkNumber(number) {
  const num = Number(number);
  if (isNaN(num)) {
    return 0;
  }
  return Math.abs(number);
}

function showChartPaymentByYear(year) {
  // const labelElement = document.getElementById("label-statistical-pay-earch-month-by-year");
  // labelElement?.innerText = `Tiền tiêu mỗi tháng trong năm ${year}`;

  const totalPaymentEachMonthByYear = [
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
    { totalPay: 0, quantityOrder: 0 },
  ];

  orders.forEach((order) => {
    if (
      order.processing_info.order_time_year == year &&
      order.status != "label_order_cancelled"
    ) {
      const month =
        totalPaymentEachMonthByYear[
          order.processing_info.order_time.getMonth()
        ];

      month.quantityOrder++;

      order.parcel?.forEach((parcel) => {
        month.totalPay +=
          checkNumber(parcel?.payment_info.total_price) / 100000;
      });
    }
  });

  console.log(totalPaymentEachMonthByYear);

  // Area Chart Example
  document.getElementById(
    "chart-area"
  ).innerHTML = `<canvas id="myAreaChart"></canvas>`;
  var ctx = document.getElementById("myAreaChart");
  var myLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
      ],
      datasets: [
        {
          label: "Tháng",
          lineTension: 0.3,
          backgroundColor: "rgba(78, 115, 223, 0.05)",
          borderColor: "rgba(78, 115, 223, 1)",
          pointRadius: 3,
          pointBackgroundColor: "rgba(78, 115, 223, 1)",
          pointBorderColor: "rgba(78, 115, 223, 1)",
          pointHoverRadius: 3,
          pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
          pointHoverBorderColor: "rgba(78, 115, 223, 1)",
          pointHitRadius: 10,
          pointBorderWidth: 2,
          data: totalPaymentEachMonthByYear.map((month) => month.totalPay),
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 25,
          top: 25,
          bottom: 0,
        },
      },
      scales: {
        xAxes: [
          {
            time: {
              unit: "date",
            },
            gridLines: {
              display: false,
              drawBorder: false,
            },
            ticks: {
              maxTicksLimit: 7,
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              maxTicksLimit: 5,
              padding: 10,
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                if (value < 1000) {
                  return number_format(value) + " đ";
                }
                if (value < 1000000) {
                  value = value / 1000;
                  return number_format(value) + " K";
                }
                value = value / 1000000;
                return number_format(value) + " Tr";
              },
            },
            gridLines: {
              color: "rgb(234, 236, 244)",
              zeroLineColor: "rgb(234, 236, 244)",
              drawBorder: false,
              borderDash: [2],
              zeroLineBorderDash: [2],
            },
          },
        ],
      },
      legend: {
        display: false,
      },
      tooltips: {
        backgroundColor: "rgb(255,255,255)",
        bodyFontColor: "#858796",
        titleMarginBottom: 10,
        titleFontColor: "#6e707e",
        titleFontSize: 14,
        borderColor: "#dddfeb",
        borderWidth: 1,
        xPadding: 15,
        yPadding: 15,
        displayColors: false,
        intersect: false,
        mode: "index",
        caretPadding: 10,
        callbacks: {
          label: function (tooltipItem, chart) {
            var datasetLabel =
              chart.datasets[tooltipItem.datasetIndex].label || "";

            var month = Number(tooltipItem.xLabel.replace("Tháng", "")) - 1;
            var value = totalPaymentEachMonthByYear[month];
            if (tooltipItem.yLabel != 0) {
              // showProductBoughtInMonthAndYear(month, Number(data.year));
              console.log("Month : " + month);
              return `Đã tiêu: ${number_format(tooltipItem.yLabel)} VNĐ - ${
                value.quantityOrder
              } Đơn `;
            } else {
              return "Đã tiêu: 0";
            }
          },
        },
      },
    },
  });
}
