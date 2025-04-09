document.addEventListener('DOMContentLoaded', function () {
    const getVal = (id) => {
        return parseInt($(`#${id}`).val()); // Fixed template literal issue
    };
    const storeState = () => {
        // store the contents for retrieval
        const t = $('input');
        let inputValues = {};
        let resContents = {};
        t.each((i, r) => {
            const R = $(r);
            inputValues[i] = R.val(); // Store input values
        });
        $('.res').each((i, r) => {
            const R = $(r);
            resContents[i] = R.html(); // Store .res contents
        });
        localStorage.setItem('inputValues', JSON.stringify(inputValues));
        localStorage.setItem('resContents', JSON.stringify(resContents));
    };
    let scores = [];
    const createScore = (r, s, d, v, c) => {
        return `${r}_${s}_${d}_${v}_${c}`;
    };
    const checkScores = () => {
        scores.forEach(s => {
            if (scores.filter(i => s === i).length > 1) {
                console.log(`duplicate score: ${s}`);
            }
        });
    };
    const getRoundScores = (r, a) => {
        const A = a || scores;
        return A.filter(s => parseInt(s.split('_')[0]) === parseInt(r));
    };
    const getSrcScores = (r, a) => {
        const A = a || scores;
        return A.filter(s => parseInt(s.split('_')[1]) === parseInt(r));
    };
    const getDestScores = (r, a) => {
        const A = a || scores;
        return A.filter(s => parseInt(s.split('_')[2]) === parseInt(r));
    };
    const getTotalVals = (a) => {
        let t = 0;
        a.forEach(s => {
            const v = parseInt(s.split('_')[3]);
//            console.log(a, v);
            t += isNaN(v) ? 0: v;
        });
        return t;
    };
    const getScoreValue = (s) => {
        const r = s === undefined ? 0 : parseInt(s.split('_')[3]);
        return r;
    };
    const calc = () => {
        buildScores();
        displayTotals();
        storeState();
    };
    const processData = () => {
        const out = {};
        const T = 5;
        const gtv = getTotalVals;
        const gds = getDestScores;
        const grs = getRoundScores;
        const gsv = getScoreValue;
        let shArray = new Array();
        let shTotal = new Array(5).fill(0);
        let c = 0;
        for (let i = 0; i < T; i++) {
            const a = gsv(grs(1)[i]);
            const t = gtv(gds(i, grs(4)));
            const at = gtv(gds(i, grs(3))) + gtv(gds(i, grs(4))); /* formula N */
            const pv1 = gtv(gds(i, grs(2))); /* first PV total */
            const apv1 = a * pv1;
            const pv2 = gtv(gds(i, grs(5))); /* second PV total */
            const acpvf = (gtv(gds(i, grs(3))) + gtv(gds(i, grs(4)))) * gtv(gds(i, grs(5))); /* formula P */
            for (let j = 0; j < T; j++) {
                const coll = gds(i, grs(4));
                const sc = getScoreValue(coll[j]);
                const f = (sc / at) * acpvf;
                shArray.push(f);
                if (!isNaN(f)) {
                    shTotal[i] += f;
                }
            };
            out[`r${i}`] = {
                collTotal: t,
                allCollTotal: at,
                pv1: pv1,
                total2030: apv1,
                pv2: pv2,
                allCollPV: acpvf,
                shTotal: shTotal,
                shArray: []
            };
        }
        Object.values(out).forEach((r, i) => {
            for (let j = 0; j < T; j++) {
                r.shArray.push(shArray[(j * T) + i]);
            }
            r.shTotal = r.shArray.reduce((total, num) => total + (isNaN(num) ? 0 : num), 0);
            r.scorePlusShare = r.shTotal + r.allCollPV;
            r.grandTotal = r.scorePlusShare + r.total2030;
        });

//        console.log(out);
//        Object.values(out).forEach(r => {console.log(r)});
        return out;
    };
    const displayTotals = () => {
        const T = processData();
        const R = $('.inputs');
        if (Object.values(T).length !== R.length) {
            console.log('data error: mismatch between processed team scores and display rows');
        } else {
            R.each((i, ri) => {
                const r = $(ri);
                const t = Object.values(T)[i];
                const pvt1 = $(r.find('.pvt1'));
                const total2030 = $(r.find('.2030total'));
                const totalColl = $(r.find('.ctotal'));
                const allCollTotal = $(r.find('.allCollTotal'));
                const pvt2 = $(r.find('.pvt2'));
                const allCollPV = $(r.find('.allCollPV'));
                const shTotal = $(r.find('.shTotal'));
                const scoreShare = $(r.find('.scoreShare'));
                const total2040 = $(r.find('.2040total'));
                //
                const sh = r.find('.sval');
                sh.each((i, s) => {
                    const v = t.shArray[i];
                    $(s).html(v);
                    if (isNaN(v)) {
                        $(s).css({'background-color': 'grey'})
                    }
                });
                pvt1.html(t.pv1);
                total2030.html(t.total2030);
                totalColl.html(t.collTotal);
                allCollTotal.html(t.allCollTotal);
                pvt2.html(t.pv2);
                allCollPV.html(t.allCollPV);
                shTotal.html(t.shTotal);
                scoreShare.html(t.scorePlusShare);
                total2040.html(t.grandTotal);
            })
        }
    };
    const buildScores = () => {
        scores = [];
        const R = $('.inputs');
        // round 1 Allocation 1
        let r = 1;
        const A1 = $('.a1');
        A1.each((i, e) => {
            scores.push(createScore(r, i, i, parseInt($(e).val()), i));
        });
        // round 2 PV 1
        r = 2;
        const pv_1_1 = $('.pv_1_1');
        const pv_1_2 = $('.pv_1_2');
        pv_1_1.each((i, e) => {
            scores.push(createScore(r, 5, i, parseInt($(e).val()), 5));
        });
        pv_1_2.each((i, e) => {
            scores.push(createScore(r, 6, i, parseInt($(e).val()), 6));
        });
        // round 3 Allocation 2
        r = 3;
        const A2 = $('.a2');
        A2.each((i, e) => {
            scores.push(createScore(r, i, i, parseInt($(e).val()), i));
        });
        // round 4 Collaboration
        r = 4;
        R.each((i, e) => {
            const C = $(e).find('.ci');
            C.each((j, c) => {
//                if (i !== j) {
                    scores.push(createScore(r, j, i, i === j ? 'x' : parseInt($(c).val()), j));
//                }
            });
        });
        // round 5 PV 2
        r = 5;
        const pv_2_1 = $('.pv_2_1');
        const pv_2_2 = $('.pv_2_2');
        pv_2_1.each((i, e) => {
            scores.push(createScore(r, 5, i, parseInt($(e).val()), 5));
        });
        pv_2_2.each((i, e) => {
            scores.push(createScore(r, 6, i, parseInt($(e).val()), 6));
        });
        //
        checkScores();
//        console.log(scores);
//        console.log(getRoundScores(4));
    };
    const resetAll = () => {
        $('input').val(0);
        $('.res').html(0);
        storeState();
    };
    const init = () => {
        window.renderTemplate('insertion', 'dev_scoretest', { teams: [0, 1, 2, 3, 4] }, () => {
            // Restore input values
            const storedInputValues = JSON.parse(localStorage.getItem('inputValues')) || {};
            $('input').each((i, ip) => {
                $(ip).val(storedInputValues[i] || 0);
            });

            // Restore .res contents
            const storedResContents = JSON.parse(localStorage.getItem('resContents')) || {};
            $('.res').each(function () {
                const id = $(this).attr('id');
                $(this).html(storedResContents[id] || 0);
            });

            // Event listeners
            $(document).on('change', 'input', calc);
            $(document).on('input', 'input', function () {
                this.value = this.value
                    .replace(/[^0-9-]/g, '')      // allow digits and minus sign
                    .replace(/(?!^)-/g, '')       // remove minus sign if not at start
                    .slice(0, 3);                 // limit to 3 chars (to allow -99)
            });
            $(document).on('focus', 'input', function () {
                $(this).attr('type', 'number');
            });
            $('#reset').off('click').on('click', resetAll);
            const r = $('.inputs');
            r.each((i, row) => {
                const ci = $(row).find('.ci');
                ci.each((j, c) => {
                    if (i === j) {
                        $(c).attr('disabled', true);
                        $(c).css({'background-color': '#767676'})
                        $(c).val('')
                    }
                })
            })
            calc();

        });
    };

    init();
});
