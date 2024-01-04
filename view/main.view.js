var orders = [];
let year = new Date().getFullYear();

const formatterCurrency = (number) =>
  number.toLocaleString("it-IT", { style: "currency", currency: "VND" });

(async function main() {
  // get data from storage
  orders = await getDataOrders();
  console.log(orders);

  renderData();

  addEventListener();
})();

function renderData() {
  renderSelectYear();

  renderSelectYearProduct();

  renderCardOverviewByYear();

  renderPurchaseProductByMonth(new Date().getMonth() + 1);
}

const syncData = async () => {
  alert(
    "Vui lòng Đăng nhập vào SHOPEE và KHÔNG tắt trang web trong quá trình đồng bộ dữ liệu"
  );

  chrome.storage.local.set({
    orders: orders,
    status: "",
    time: "",
  });

  // open shoppe in new tab
  chrome.tabs.create({ url: "https://shopee.vn/" });
};

async function getDataOrders() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("orders", function (data) {
      const newOrders = data.orders.map((order) => {
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
}

function addEventListener() {
  const selectYear = document.getElementById("statistical-with-year");
  selectYear.addEventListener("change", (e) => {
    year = e.target.value;

    renderCardOverviewByYear(year);
    showChartPaymentByYear(year);
    renderPurchaseProductByMonth(new Date().getMonth() + 1);
  });

  // list purchase product
  const btnMonths = document.querySelectorAll(".btn-month");
  btnMonths.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const month = e.target.value;
      renderPurchaseProductByMonth(month);
    });
  });

  const btnSyncData = document.getElementById("btn-sync-data");
  btnSyncData.addEventListener("click", (e) => {
    syncData();
  });
}

function renderSelectYear() {
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
}

function renderSelectYearProduct() {
  // get all year from processingInfos.ship_time
  const years = new Set();
  orders.forEach((order) => {
    years.add(order.processing_info.order_time_year);
  });

  const selectYear = document.getElementById(
    "select-statistical-purchase-product-by-year"
  );

  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.innerText = year;
    selectYear?.appendChild(option);
  });
}

function renderCardOverviewByYear(year) {
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
  const coinsElement = document.getElementById("coin-total");

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

          acc.coins +=
            checkNumber(parcel?.payment_info.redeemed_number_coins) / 100000;

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

  quantityOrderSuccessElement.innerText = result.quantityOrderSuccess + " Đơn";

  quantityPurchaseProductElement.innerText =
    result.quantityPurchaseProduct + " Sản phẩm";

  shippingFeeTotalElement.innerText = formatterCurrency(
    result.shippingFeeTotal / 100000
  );

  saveTotalElement.innerText = formatterCurrency(result.saveTotal / 100000);

  quantityOrderCancelElement.innerText = result.quantityOrderCancel + " Đơn";

  coinsElement.innerText = result.coins + " Xu";
}

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
  const labelElement = document.getElementById(
    "label-statistical-pay-earch-month-by-year"
  );
  labelElement.innerHTML = `Tiền tiêu mỗi tháng trong năm ${year}`;
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

function renderPurchaseProductByMonth(month) {
  const label = document.getElementById("label-purchase-product");
  const purchaseProductsElement = document.getElementById("purchase-products");

  label.innerText = `Sản phẩm đã mua trong tháng ${month} năm ${year}`;

  const btnMonths = document.querySelectorAll(".btn-month");
  btnMonths.forEach((btn) => {
    btn.classList.remove("btn-outline-primary");
  });
  const btnMonth = document.getElementById(`btn-month-${month}`);
  btnMonth.classList.add("btn-outline-primary");

  let listProducts = [];

  orders.forEach((order) => {
    if (
      order.processing_info.order_time_year == year &&
      order.status != "label_order_cancelled" &&
      order.processing_info.order_time.getMonth() + 1 == month
    ) {
      listProducts.push(...order.items);
    }
  });

  // group listProducts by itemId and amount ++
  listProducts = listProducts.reduce((acc, product) => {
    const index = acc.findIndex((item) => item.itemId == product.itemId);
    if (index == -1) {
      acc.push(product);
    } else {
      acc[index].amount += product.amount;
    }
    return acc;
  }, []);

  if (listProducts.length == 0) {
    purchaseProductsElement.innerHTML = `
    <span class="  d-flex justify-content-center align-items-center  text-danger " style="font-size:15px">
     Bạn chưa mua gì trong tháng ${month}/${year} </span>
    `;
    return;
  }

  purchaseProductsElement.innerHTML = "";

  purchaseProductsElement.innerHTML = listProducts
    .map((product) => {
      if (!product.name || product.model_name == undefined) return ``;
      var name =
        product.name.length > 55
          ? product.name.substring(0, 52) + "..."
          : product.name;
      var model =
        product.model_name.length > 30
          ? product.model_name.substring(0, 30) + "..."
          : product.model_name;

      name = name.replace("-", ""); //  '3D - Khổ' => '3D---Kho'

      var urlProduct =
        "https://shopee.vn/" +
        name.replace(/ +/g, "-") +
        "-i." +
        product.shopId +
        "." +
        product.itemId;

      return `
      <div class="row align-items-center item data-orderId=${product.orderId}">
          <div class="col-2  bg-gradient-light"
              style=" width: 100px; height: 50px; padding: 0; display: flex;">
              <img src="https://cf.shopee.vn/file/${
                product.image
              }"  class="card-img" alt="...">
          </div>
          <div class="col-8  d-flex lign-items-start flex-column justify-content-center pr-0">
              <a href="${urlProduct} " target="_blank" class="card-title text-dark mb-0 pb-0 " style="font-size:12px">
                  ${name}
              </a>
              <small class=""  style="font-size:10px"> Loại hàng: ${model}</small>
              <span class="card-text text-danger" style="font-size:15px"> ${formatterCurrency(
                (product.item_price / 100000) * product.amount
              )} </span>
          </div>
          <div
              class="col-2 d-flex lign-items-start flex-column justify-content-center pl-0 pr-0">
              <p class="text-center " style="font-size:12px">X ${checkNumber(
                product.amount
              )} </p>
              <a class="text-center" style="font-size:12px" href="https://shopee.vn/user/purchase/order/${
                product.orderId
              }" target="_blank" ><small>Đơn hàng
                  </small></a>
          </div>
      </div>
      `;
    })
    .join("");
}
