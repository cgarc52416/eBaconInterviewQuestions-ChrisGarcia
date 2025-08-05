const empCompOb = [];
const empBenOb = [];

// Round to 4 decimal places
function roundTotals(num) {
    const rounded = (Math.round(num * 10000) / 10000).toFixed(4);
    return rounded;
}

// Calculate Benefit Total vs Percent
function calculatePercent(total, percent) {
    const percentage = total * percent / 100;
    return percentage;
}

// Read and Calculate Benefits/Investments
const processBenefits = async (empCompOb, employeeList, key) => {
    try {
        const response = await fetch('./data/benefitAllocations.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        // Create housing for compensation
        $(".content.benefits").append(employeeList);

        const data = await response.json(); // Parse the response as JSON

        data.BenefitAllocations.forEach(bElects => {
            let benefitTotal = bPercent401k = bPercentFSA = bPercentHSA = bPercentDental = kPercentAPPL = kPercentTSLA = kPercentMSFT = kPercentGME = kPercentADBE = 0;

            if (bElects.employee === key) {
                benefitTotal = empCompOb[key].benefitTotal;
                bElects.BenefitPercent.forEach(bPercents => {
                    bPercent401k = calculatePercent(bPercents.k401, benefitTotal);
                    bPercentFSA = calculatePercent(bPercents.FSA, benefitTotal);
                    bPercentHSA = calculatePercent(bPercents.HSA, benefitTotal);
                    bPercentDental = calculatePercent(bPercents.Dental, benefitTotal);

                    Investments.forEach(investment => {
                        if (investment.employee === key) {
                            investment.InvestmentsPercent.forEach(invest => {
                                kPercentAPPL = calculatePercent(invest.APPL, bPercent401k);
                                kPercentTSLA = calculatePercent(invest.TSLA, bPercent401k);
                                kPercentMSFT = calculatePercent(invest.MSFT, bPercent401k);
                                kPercentGME = calculatePercent(invest.GME, bPercent401k);
                                kPercentADBE = calculatePercent(invest.ADBE, bPercent401k);
                            });
                        }
                    });
                });

                empBenOb[key] = {
                    employee: key,
                    total: roundTotals(empCompOb[key].benefitTotal),
                    k401: roundTotals(bPercent401k),
                    fsa: roundTotals(bPercentFSA),
                    hsa: roundTotals(bPercentHSA ? bPercentHSA : 0),
                    dental: roundTotals(bPercentDental ? bPercentDental : 0),
                    appl: roundTotals(kPercentAPPL ? kPercentAPPL : 0),
                    tsla: roundTotals(kPercentTSLA ? kPercentTSLA : 0),
                    msft: roundTotals(kPercentMSFT ? kPercentMSFT : 0),
                    gme: roundTotals(kPercentGME ? kPercentGME : 0),
                    adbe: roundTotals(kPercentADBE ? kPercentADBE : 0)
                };

                $(".content.benefits #employees").append(`
                    <div class="employee-container">
                        <h3>${empBenOb[key].employee}</h3>
                        <p>Benefits Total: ${empBenOb[key].total}</p>
                        <p>401K Total: ${empBenOb[key].k401}</p>
                        <p>401k Invested:</p>
                        <span>APPL Total: ${empBenOb[key].appl}</span>
                        <span>TSLA Total: ${empBenOb[key].tsla}</span>
                        <span>MSFT Total: ${empBenOb[key].msft}</span>
                        <span>GME Total: ${empBenOb[key].gme}</span>
                        <span>ADBE Total: ${empBenOb[key].adbe}</span>
                        <p>FSA Total: ${empBenOb[key].fsa}</p>
                        <p>HSA Total: ${empBenOb[key].hsa}</p>
                        <p>Dental Total: ${empBenOb[key].dental}</p>
                    </div>
                `);

                
            }
        });
    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
};

// Read and Calculate Total Compensation
const processTotalComp = async () => {
    try {
        const response = await fetch('./data/employeeData.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        // Create housing for compensation
        const employeeList = document.createElement("div");
        employeeList.setAttribute("id", "employees");
        $(".content.punches").append(employeeList);

        const data = await response.json(); // Parse the response as JSON
        // For Each Employee
        data.employeeData.forEach(comp => {
            let key = comp.employee;
            let totalBenefits = regWages = regTime = overTime = overTimeWages = doubleTime = doubleTimeWages = totalHours = newTotalHours = thisOvertime = regNeeded = overNeeded = thisDoubletime = totalWages = 0;

            // For Each Time Punch
            comp.timePunch.forEach(details => {
                const startT = new Date(details.start);
                const endT = new Date(details.end);
                const shiftHours = (new Date(endT) - new Date(startT)) / (1000 * 60 * 60);
                newTotalHours = totalHours + shiftHours;

                // Calculate benefits/wages per punch and add to total benefits/wages
                jobCodes.forEach(code => {
                    if (code.job === details.job) {

                        // Calculate total benefits
                        totalBenefits += (shiftHours * code.benefitsRate);

                        if (newTotalHours <= 40) { // Reg time bracket
                            regTime = newTotalHours;
                            regWages += (shiftHours * code.rate);
                        } else if (newTotalHours > 40 && newTotalHours <= 48) { // Overtime bracket
                            regNeeded = 40 - totalHours;
                            regTime = totalHours + regNeeded;

                            if (regNeeded > 0) {
                                regWages += (regNeeded * code.rate);
                            }

                            thisOvertime = shiftHours - regNeeded;
                            overTime += thisOvertime;
                            overTimeWages += (thisOvertime * code.rate * 1.5);
                        } else { // Doubletime bracket
                            if (totalHours < 40) { // Need to add to regular hours
                                regNeeded = 40 - totalHours;
                                regTime = totalHours + regNeeded;
                                regWages += (regNeeded * code.rate);
                                overTime = 8;
                                overTimeWages += (8 * code.rate * 1.5);
                                thisDoubletime = shiftHours - overTime - regNeeded;
                                doubleTime += thisDoubletime;
                                doubleTimeWages += (thisDoubletime * code.rate * 2);
                            } else {
                                regTime = 40;
                                regNeeded = 0;

                                if (totalHours < 48) { // Need to add to overtime
                                    overNeeded = 48 - totalHours;
                                    overTime += overNeeded;
                                    overTimeWages += (overNeeded * code.rate * 1.5);
                                    thisDoubletime = shiftHours - overNeeded - regNeeded;
                                    doubleTime += thisDoubletime;
                                    doubleTimeWages += (thisDoubletime * code.rate * 2);
                                } else { // Add only to doubletime
                                    doubleTime = newTotalHours - 48;
                                    doubleTimeWages += (shiftHours * code.rate * 2);
                                }
                            }
                        }
                    }
                });

                totalWages = regWages + overTimeWages + doubleTimeWages;
                totalHours = newTotalHours;
            });

            empCompOb[key] = {
                employee: comp.employee,
                regular: roundTotals(regTime),
                overtime: roundTotals(overTime),
                doubletime: roundTotals(doubleTime),
                wageTotal: roundTotals(totalWages),
                benefitTotal: roundTotals(totalBenefits)
            };
            
            processBenefits(empCompOb, employeeList, key);

            $(".content.punches #employees").append(`
                <div class="employee-container">
                    <h3>${empCompOb[key].employee}</h3>
                    <p>Regular Time: ${empCompOb[key].regular}</p>
                    <p>Overtime: ${empCompOb[key].overtime}</p>
                    <p>Double Time: ${empCompOb[key].doubletime}</p>
                    <p>Wage Total: ${empCompOb[key].wageTotal}</p>
                    <p>Benefits Total: ${empCompOb[key].benefitTotal}</p>
                </div>
            `);
        });

        console.log(empCompOb);
        console.log(empBenOb);
    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
};

// Define Job Codes / Rates
const getJobs = async () => {
    try {
        const response = await fetch('./data/jobMeta.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json(); // Parse the response as JSON
        globalThis.jobCodes = data.jobMeta;

        // Compare and calculate employee hours worked to jobs for compensation
        processTotalComp();
    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
};

// Define Investment Percentages
const getInvestments = async () => {
    try {
        const response = await fetch('./data/benefitAllocations.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json(); // Parse the response as JSON
        globalThis.Investments = data.InvestmentAllocations;
    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
};

$(document).ready(() => {
    getJobs();
    getInvestments();
});
