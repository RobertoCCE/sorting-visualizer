import React, {
    useState,
    useEffect,
    useRef,
} from "react";

import {
    RotateCcw,
    Zap,
    Pause,
    Play,
    Square,
    Search,
    ArrowLeftRight,
    BarChart3,
    ChevronDown,
    Gauge,
    Check,
    Circle,
    Turtle,
} from "lucide-react";

const WIDTH = 950;
const HEIGHT = 400;

function SortingVisualizer() {

    // =========================
    // ESTADOS
    // =========================

    const [data, setData] = useState([]);
    const [comparisons, setComparisons] = useState(0);
    const [swaps, setSwaps] = useState(0);
    const [speed, setSpeed] = useState(100);
    const [algorithm, setAlgorithm] = useState("Quick Sort");
    const [barCount, setBarCount] = useState(40);

    const [isSorting, setIsSorting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSorted, setIsSorted] = useState(false);
    const [activeIndices, setActiveIndices] = useState([]);

    // =========================
    // REFS
    // =========================

    const pausedRef = useRef(false);
    const stoppedRef = useRef(false);
    const audioContextRef = useRef(null);

    // Identifica cada ejecución.
    const sortRunRef = useRef(0);

    // =========================
    // GENERAR DATOS
    // =========================

    useEffect(() => {
        generateData();
    }, []);

    const generateData = () => {

        const arr = Array.from(
            { length: barCount },
            () =>
                Math.floor(
                    Math.random() * 350
                ) + 30
        );

        setData(arr);
        setComparisons(0);
        setSwaps(0);
        setIsSorted(false);
        setIsPaused(false);
        setActiveIndices([]);

        pausedRef.current = false;
        stoppedRef.current = false;

        // Invalidar cualquier ejecución anterior
        sortRunRef.current += 1;
    };

    // =========================
    // GENERAR DATOS NUEVOS
    // =========================

    const generateNewData = (amount = barCount) => {

        const arr = Array.from(
            { length: amount },
            () =>
                Math.floor(
                    Math.random() * 350
                ) + 30
        );

        setData(arr);
        setComparisons(0);
        setSwaps(0);
        setIsSorted(false);
        setIsPaused(false);
        setActiveIndices([]);

        pausedRef.current = false;
        stoppedRef.current = false;

        sortRunRef.current += 1;
    };

    // =========================
    // CAMBIAR CANTIDAD
    // =========================

    const handleBarCountChange = (e) => {

        const amount = Number(e.target.value);

        setBarCount(amount);

        if (!isSorting) {
            generateNewData(amount);
        }
    };

    // =========================
    // CAMBIAR ALGORITMO
    // =========================

    const handleAlgorithmChange = (e) => {

        const newAlgorithm = e.target.value;

        setAlgorithm(newAlgorithm);

        /*
         * Si el algoritmo anterior ya terminó,
         * los datos están ordenados.
         *
         * Al cambiar de algoritmo generamos
         * automáticamente nuevos datos para
         * que el nuevo algoritmo pueda visualizarse.
         */
        if (isSorted) {
            generateNewData(barCount);
        } else {
            setIsSorted(false);
            setComparisons(0);
            setSwaps(0);
            setActiveIndices([]);
        }
    };

    // =========================
    // AUDIO
    // =========================

    const playMoveSound = (value = 200) => {

        try {

            if (!audioContextRef.current) {

                audioContextRef.current =
                    new (
                        window.AudioContext ||
                        window.webkitAudioContext
                    )();
            }

            const audioContext =
                audioContextRef.current;

            if (
                audioContext.state === "suspended"
            ) {
                audioContext.resume();
            }

            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();

            const frequency =
                150 + value * 2;

            oscillator.frequency.value =
                Math.min(frequency, 900);

            oscillator.type = "sine";

            gain.gain.setValueAtTime(
                0.2,
                audioContext.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.currentTime + 0.07
            );

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start();

            oscillator.stop(
                audioContext.currentTime + 0.07
            );

        } catch (error) {

            console.log(
                "Audio no disponible:",
                error
            );
        }
    };

    // =========================
    // ESPERA
    // =========================

    const sleep = async (
        ms,
        currentRun
    ) => {

        let elapsed = 0;

        while (elapsed < ms) {

            if (
                stoppedRef.current ||
                currentRun !== sortRunRef.current
            ) {
                return false;
            }

            while (pausedRef.current) {

                if (
                    stoppedRef.current ||
                    currentRun !== sortRunRef.current
                ) {
                    return false;
                }

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            50
                        )
                );
            }

            const step =
                Math.min(
                    20,
                    ms - elapsed
                );

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        step
                    )
            );

            elapsed += step;
        }

        return (
            !stoppedRef.current &&
            currentRun === sortRunRef.current
        );
    };

    // =========================
    // ESPERAR PAUSA
    // =========================

    const waitIfPaused = async (
        currentRun
    ) => {

        while (pausedRef.current) {

            if (
                stoppedRef.current ||
                currentRun !== sortRunRef.current
            ) {
                return false;
            }

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        50
                    )
            );
        }

        if (
            stoppedRef.current ||
            currentRun !== sortRunRef.current
        ) {
            return false;
        }

        return true;
    };

    // =========================
    // MOVIMIENTO
    // =========================

    const showMovement = (
        indices,
        value
    ) => {

        setActiveIndices(indices);
        playMoveSound(value);
    };

    // =========================
    // PAUSAR
    // =========================

    const pauseSorting = () => {

        if (!isSorting) {
            return;
        }

        pausedRef.current = true;
        setIsPaused(true);
    };

    // =========================
    // CONTINUAR
    // =========================

    const continueSorting = () => {

        if (!isSorting) {
            return;
        }

        pausedRef.current = false;
        setIsPaused(false);
    };

    // =========================
    // DETENER / REINICIAR
    // =========================

    const stopAndRestart = () => {

        // Invalidar inmediatamente la ejecución actual
        sortRunRef.current += 1;

        stoppedRef.current = true;
        pausedRef.current = false;

        setIsSorting(false);
        setIsPaused(false);
        setIsSorted(false);
        setActiveIndices([]);

        setComparisons(0);
        setSwaps(0);

        // Crear datos completamente nuevos
        const arr = Array.from(
            { length: barCount },
            () =>
                Math.floor(
                    Math.random() * 350
                ) + 30
        );

        setData(arr);

        stoppedRef.current = false;
    };

    // =========================
    // QUICK SORT
    // =========================

    const quickSort = async (
        arr,
        start,
        end,
        currentRun
    ) => {

        if (
            stoppedRef.current ||
            currentRun !== sortRunRef.current
        ) {
            return;
        }

        if (start < end) {

            const canContinue =
                await waitIfPaused(
                    currentRun
                );

            if (!canContinue) {
                return;
            }

            const pivotIndex =
                await partition(
                    arr,
                    start,
                    end,
                    currentRun
                );

            if (
                stoppedRef.current ||
                currentRun !== sortRunRef.current
            ) {
                return;
            }

            await quickSort(
                arr,
                start,
                pivotIndex - 1,
                currentRun
            );

            if (
                stoppedRef.current ||
                currentRun !== sortRunRef.current
            ) {
                return;
            }

            await quickSort(
                arr,
                pivotIndex + 1,
                end,
                currentRun
            );
        }
    };

    const partition = async (
        arr,
        start,
        end,
        currentRun
    ) => {

        const pivot = arr[end];

        let i = start - 1;

        for (
            let j = start;
            j < end;
            j++
        ) {

            const canContinue =
                await waitIfPaused(
                    currentRun
                );

            if (!canContinue) {
                return start;
            }

            setComparisons(
                (c) => c + 1
            );

            setActiveIndices([
                j,
                end,
            ]);

            if (arr[j] <= pivot) {

                i++;

                if (i !== j) {

                    [
                        arr[i],
                        arr[j],
                    ] = [
                        arr[j],
                        arr[i],
                    ];

                    setSwaps(
                        (s) => s + 1
                    );

                    setData([...arr]);

                    showMovement(
                        [i, j],
                        arr[i]
                    );

                    const completed =
                        await sleep(
                            speed,
                            currentRun
                        );

                    if (!completed) {
                        return start;
                    }
                }
            }
        }

        const canContinue =
            await waitIfPaused(
                currentRun
            );

        if (!canContinue) {
            return start;
        }

        if (i + 1 !== end) {

            [
                arr[i + 1],
                arr[end],
            ] = [
                arr[end],
                arr[i + 1],
            ];

            setSwaps(
                (s) => s + 1
            );

            setData([...arr]);

            showMovement(
                [i + 1, end],
                arr[i + 1]
            );

            const completed =
                await sleep(
                    speed,
                    currentRun
                );

            if (!completed) {
                return start;
            }
        }

        return i + 1;
    };

    // =========================
    // BUBBLE SORT
    // =========================

    const bubbleSort = async (
        arr,
        currentRun
    ) => {

        const n = arr.length;

        for (
            let i = 0;
            i < n - 1;
            i++
        ) {

            for (
                let j = 0;
                j < n - i - 1;
                j++
            ) {

                const canContinue =
                    await waitIfPaused(
                        currentRun
                    );

                if (!canContinue) {
                    return;
                }

                setComparisons(
                    (c) => c + 1
                );

                setActiveIndices([
                    j,
                    j + 1,
                ]);

                if (
                    arr[j] >
                    arr[j + 1]
                ) {

                    [
                        arr[j],
                        arr[j + 1],
                    ] = [
                        arr[j + 1],
                        arr[j],
                    ];

                    setSwaps(
                        (s) => s + 1
                    );

                    setData([...arr]);

                    showMovement(
                        [j, j + 1],
                        arr[j]
                    );

                    const completed =
                        await sleep(
                            speed,
                            currentRun
                        );

                    if (!completed) {
                        return;
                    }
                }
            }
        }
    };

    // =========================
    // INSERTION SORT
    // =========================

    const insertionSort = async (
        arr,
        currentRun
    ) => {

        for (
            let i = 1;
            i < arr.length;
            i++
        ) {

            const canContinue =
                await waitIfPaused(
                    currentRun
                );

            if (!canContinue) {
                return;
            }

            const key = arr[i];

            let j = i - 1;

            while (j >= 0) {

                const canContinue =
                    await waitIfPaused(
                        currentRun
                    );

                if (!canContinue) {
                    return;
                }

                setComparisons(
                    (c) => c + 1
                );

                setActiveIndices([
                    j,
                    j + 1,
                ]);

                if (arr[j] > key) {

                    arr[j + 1] =
                        arr[j];

                    setSwaps(
                        (s) => s + 1
                    );

                    setData([...arr]);

                    showMovement(
                        [j, j + 1],
                        arr[j + 1]
                    );

                    const completed =
                        await sleep(
                            speed,
                            currentRun
                        );

                    if (!completed) {
                        return;
                    }

                    j--;

                } else {

                    break;
                }
            }

            arr[j + 1] = key;

            setData([...arr]);

            showMovement(
                [j + 1],
                key
            );

            const completed =
                await sleep(
                    speed,
                    currentRun
                );

            if (!completed) {
                return;
            }
        }
    };

    // =========================
    // SELECTION SORT
    // =========================

    const selectionSort = async (
        arr,
        currentRun
    ) => {

        const n = arr.length;

        for (
            let i = 0;
            i < n - 1;
            i++
        ) {

            const canContinue =
                await waitIfPaused(
                    currentRun
                );

            if (!canContinue) {
                return;
            }

            let minIndex = i;

            for (
                let j = i + 1;
                j < n;
                j++
            ) {

                const canContinue =
                    await waitIfPaused(
                        currentRun
                    );

                if (!canContinue) {
                    return;
                }

                setComparisons(
                    (c) => c + 1
                );

                setActiveIndices([
                    minIndex,
                    j,
                ]);

                const completed =
                    await sleep(
                        Math.max(
                            speed / 2,
                            10
                        ),
                        currentRun
                    );

                if (!completed) {
                    return;
                }

                if (
                    arr[j] <
                    arr[minIndex]
                ) {
                    minIndex = j;
                }
            }

            if (minIndex !== i) {

                [
                    arr[i],
                    arr[minIndex],
                ] = [
                    arr[minIndex],
                    arr[i],
                ];

                setSwaps(
                    (s) => s + 1
                );

                setData([...arr]);

                showMovement(
                    [i, minIndex],
                    arr[i]
                );

                const completed =
                    await sleep(
                        speed,
                        currentRun
                    );

                if (!completed) {
                    return;
                }
            }
        }
    };

    // =========================
    // MERGE SORT
    // =========================

    const mergeSort = async (
        arr,
        left,
        right,
        currentRun
    ) => {

        if (
            stoppedRef.current ||
            currentRun !== sortRunRef.current
        ) {
            return;
        }

        if (left >= right) {
            return;
        }

        const canContinue =
            await waitIfPaused(
                currentRun
            );

        if (!canContinue) {
            return;
        }

        const middle =
            Math.floor(
                (left + right) / 2
            );

        await mergeSort(
            arr,
            left,
            middle,
            currentRun
        );

        if (
            stoppedRef.current ||
            currentRun !== sortRunRef.current
        ) {
            return;
        }

        await mergeSort(
            arr,
            middle + 1,
            right,
            currentRun
        );

        if (
            stoppedRef.current ||
            currentRun !== sortRunRef.current
        ) {
            return;
        }

        await merge(
            arr,
            left,
            middle,
            right,
            currentRun
        );
    };

    const merge = async (
        arr,
        left,
        middle,
        right,
        currentRun
    ) => {

        const leftArray =
            arr.slice(
                left,
                middle + 1
            );

        const rightArray =
            arr.slice(
                middle + 1,
                right + 1
            );

        let i = 0;
        let j = 0;
        let k = left;

        while (
            i < leftArray.length &&
            j < rightArray.length
        ) {

            const canContinue =
                await waitIfPaused(
                    currentRun
                );

            if (!canContinue) {
                return;
            }

            setComparisons(
                (c) => c + 1
            );

            setActiveIndices([
                k,
                left + i,
                middle + 1 + j,
            ]);

            if (
                leftArray[i] <=
                rightArray[j]
            ) {

                arr[k] =
                    leftArray[i];

                i++;

            } else {

                arr[k] =
                    rightArray[j];

                j++;
            }

            setSwaps(
                (s) => s + 1
            );

            setData([...arr]);

            showMovement(
                [k],
                arr[k]
            );

            const completed =
                await sleep(
                    speed,
                    currentRun
                );

            if (!completed) {
                return;
            }

            k++;
        }

        while (
            i < leftArray.length
        ) {

            const canContinue =
                await waitIfPaused(
                    currentRun
                );

            if (!canContinue) {
                return;
            }

            arr[k] =
                leftArray[i];

            i++;
            k++;

            setSwaps(
                (s) => s + 1
            );

            setData([...arr]);

            showMovement(
                [k - 1],
                arr[k - 1]
            );

            const completed =
                await sleep(
                    speed,
                    currentRun
                );

            if (!completed) {
                return;
            }
        }

        while (
            j < rightArray.length
        ) {

            const canContinue =
                await waitIfPaused(
                    currentRun
                );

            if (!canContinue) {
                return;
            }

            arr[k] =
                rightArray[j];

            j++;
            k++;

            setSwaps(
                (s) => s + 1
            );

            setData([...arr]);

            showMovement(
                [k - 1],
                arr[k - 1]
            );

            const completed =
                await sleep(
                    speed,
                    currentRun
                );

            if (!completed) {
                return;
            }
        }
    };

    // =========================
    // ORDENAR
    // =========================

    const sort = async () => {

        if (
            isSorting ||
            data.length === 0
        ) {
            return;
        }

        /*
         * Si ya estaba ordenado, al pulsar
         * "Ordenar nuevamente" generamos
         * una nueva distribución.
         */
        if (isSorted) {
            generateNewData(barCount);

            // Esperamos a que React actualice
            // los datos antes de iniciar.
            return;
        }

        // Nueva ejecución
        const currentRun =
            ++sortRunRef.current;

        setIsSorting(true);
        setIsPaused(false);
        setIsSorted(false);
        setActiveIndices([]);

        pausedRef.current = false;
        stoppedRef.current = false;

        setComparisons(0);
        setSwaps(0);

        // =========================
        // INICIAR AUDIO
        // =========================

        try {

            if (!audioContextRef.current) {

                audioContextRef.current =
                    new (
                        window.AudioContext ||
                        window.webkitAudioContext
                    )();
            }

            if (
                audioContextRef.current.state ===
                "suspended"
            ) {

                await audioContextRef.current.resume();
            }

        } catch (error) {

            console.log(
                "No se pudo iniciar audio"
            );
        }

        const arr = [...data];

        try {

            switch (algorithm) {

                case "Quick Sort":

                    await quickSort(
                        arr,
                        0,
                        arr.length - 1,
                        currentRun
                    );

                    break;

                case "Bubble Sort":

                    await bubbleSort(
                        arr,
                        currentRun
                    );

                    break;

                case "Insertion Sort":

                    await insertionSort(
                        arr,
                        currentRun
                    );

                    break;

                case "Selection Sort":

                    await selectionSort(
                        arr,
                        currentRun
                    );

                    break;

                case "Merge Sort":

                    await mergeSort(
                        arr,
                        0,
                        arr.length - 1,
                        currentRun
                    );

                    break;

                default:
                    break;
            }

            // Solo la ejecución vigente puede terminar
            if (
                !stoppedRef.current &&
                currentRun === sortRunRef.current
            ) {

                setData([...arr]);
                setActiveIndices([]);
                setIsSorted(true);
                setIsSorting(false);
                setIsPaused(false);

                pausedRef.current = false;
            }

        } catch (error) {

            console.error(
                "Error al ordenar:",
                error
            );

            if (
                currentRun === sortRunRef.current
            ) {

                setIsSorting(false);
                setIsPaused(false);
            }
        }
    };

    // =========================
    // INFORMACIÓN
    // =========================

    const getAlgorithmInfo = () => {

        switch (algorithm) {

            case "Quick Sort":

                return {
                    average: "O(n log n)",
                    worst: "O(n²)",
                    performance: "Muy rápido",
                    description:
                        "Divide los datos usando un pivote.",
                };

            case "Bubble Sort":

                return {
                    average: "O(n²)",
                    worst: "O(n²)",
                    performance: "Lento",
                    description:
                        "Compara elementos vecinos y los intercambia.",
                };

            case "Insertion Sort":

                return {
                    average: "O(n²)",
                    worst: "O(n²)",
                    performance:
                        "Bueno para pocos datos",
                    description:
                        "Inserta cada elemento en su posición correcta.",
                };

            case "Selection Sort":

                return {
                    average: "O(n²)",
                    worst: "O(n²)",
                    performance: "Lento",
                    description:
                        "Busca el elemento menor y lo coloca al inicio.",
                };

            case "Merge Sort":

                return {
                    average: "O(n log n)",
                    worst: "O(n log n)",
                    performance: "Muy rápido",
                    description:
                        "Divide los datos y después los combina ordenadamente.",
                };

            default:

                return {
                    average: "-",
                    worst: "-",
                    performance: "-",
                    description: "-",
                };
        }
    };

    const algorithmInfo =
        getAlgorithmInfo();

    // =========================
    // INTERFAZ
    // =========================

    return (

        <div
            className="
                min-h-screen
                bg-slate-950
                text-white
                px-3
                sm:px-4
                py-6
                sm:py-8
            "
        >

            {/* HEADER */}

            <div className="
                mb-6
                sm:mb-8
                text-center
            ">

                <div className="
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    sm:px-4
                    py-2
                    mb-4
                    rounded-full
                    bg-sky-500/10
                    border
                    border-sky-400/20
                    text-sky-400
                    text-xs
                    sm:text-sm
                    font-medium
                ">

                    <Circle
                        size={7}
                        fill="currentColor"
                        strokeWidth={0}
                        className="animate-pulse"
                    />

                    Algoritmos de Ordenamiento

                </div>

                <h1 className="
                    text-3xl
                    sm:text-4xl
                    md:text-5xl
                    font-bold
                    tracking-tight
                ">

                    Sorting

                    <span className="
                        text-sky-400
                    ">
                        {" "}Visualizer
                    </span>

                </h1>

                <p className="
                    text-sm
                    sm:text-base
                    text-slate-400
                    mt-3
                    max-w-2xl
                    mx-auto
                ">

                    Visualiza cómo funcionan
                    los algoritmos de ordenamiento
                    mientras organizan los datos
                    en tiempo real.

                </p>

            </div>

            {/* MAIN CARD */}

            <div className="
                bg-slate-900/80
                border
                border-slate-800
                rounded-2xl
                sm:rounded-3xl
                shadow-2xl
                overflow-hidden
            ">

                {/* HEADER CARD */}

                <div className="
                    px-4
                    sm:px-6
                    py-4
                    sm:py-5
                    border-b
                    border-slate-800
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                ">

                    <div>

                        <h2 className="
                            text-lg
                            sm:text-xl
                            font-semibold
                        ">
                            Visualización
                        </h2>

                        <p className="
                            text-xs
                            sm:text-sm
                            text-slate-500
                            mt-1
                        ">

                            {isSorted
                                ? "Ordenamiento completado"
                                : isPaused
                                    ? "Ordenamiento pausado"
                                    : isSorting
                                        ? "Ordenando datos..."
                                        : "Listo para comenzar"
                            }

                        </p>

                    </div>

                    <div className="
                        flex
                        items-center
                        gap-2
                        flex-wrap
                    ">

                        <span className="
                            text-xs
                            px-3
                            py-1
                            rounded-full
                            bg-sky-500/10
                            text-sky-400
                            border
                            border-sky-500/20
                        ">

                            {algorithm}

                        </span>

                        {isSorting &&
                            !isPaused && (

                                <span className="
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    px-3
                                    py-1
                                    rounded-full
                                    bg-yellow-500/10
                                    text-yellow-400
                                    border
                                    border-yellow-500/20
                                ">

                                    <Gauge size={13} />

                                    Ejecutando

                                </span>
                            )}

                        {isPaused && (

                            <span className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                px-3
                                py-1
                                rounded-full
                                bg-orange-500/10
                                text-orange-400
                                border
                                border-orange-500/20
                            ">

                                <Pause size={13} />

                                Pausado

                            </span>
                        )}

                        {isSorted && (

                            <span className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                px-3
                                py-1
                                rounded-full
                                bg-green-500/10
                                text-green-400
                                border
                                border-green-500/20
                            ">

                                <Check size={13} />

                                Completado

                            </span>
                        )}

                    </div>

                </div>

                {/* VISUALIZADOR */}

                <div className="
                    p-3
                    sm:p-4
                    md:p-8
                ">

                    <div
                        className="
                            relative
                            w-full
                            rounded-xl
                            sm:rounded-2xl
                            bg-slate-950
                            border
                            border-slate-800
                            overflow-hidden
                        "
                        style={{
                            height: HEIGHT,
                        }}
                    >

                        {/* GRID */}

                        <div
                            className="
                                absolute
                                inset-0
                                opacity-20
                                pointer-events-none
                            "
                            style={{
                                backgroundImage:
                                    `
                                    linear-gradient(
                                        #334155 1px,
                                        transparent 1px
                                    ),
                                    linear-gradient(
                                        90deg,
                                        #334155 1px,
                                        transparent 1px
                                    )
                                    `,
                                backgroundSize:
                                    "40px 40px",
                            }}
                        />

                        {/* BARRAS */}

                        <div
                            className="
                                absolute
                                bottom-0
                                left-0
                                right-0
                                flex
                                items-end
                                justify-center
                                px-2
                                sm:px-3
                                pb-2
                                sm:pb-3
                            "
                            style={{
                                height: HEIGHT,
                            }}
                        >

                            {data.map(
                                (
                                    value,
                                    idx
                                ) => {

                                    const isActive =
                                        activeIndices.includes(
                                            idx
                                        );

                                    return (

                                        <div
                                            key={idx}
                                            className="
                                                relative
                                                flex
                                                items-end
                                                h-full
                                            "
                                            style={{
                                                width:
                                                    `${Math.max(
                                                        100 /
                                                            data.length -
                                                        3,
                                                        2
                                                    )}%`,
                                                margin:
                                                    "0 1px",
                                            }}
                                        >

                                            <div
                                                className={`
                                                    w-full
                                                    rounded-t-md
                                                    transition-all
                                                    duration-150
                                                    shadow-lg

                                                    ${
                                                        isSorted
                                                            ? `
                                                                bg-gradient-to-t
                                                                from-green-700
                                                                via-green-500
                                                                to-emerald-300
                                                                shadow-green-500/20
                                                            `
                                                            : isActive
                                                                ? `
                                                                    bg-gradient-to-t
                                                                    from-red-600
                                                                    via-red-400
                                                                    to-red-200
                                                                    shadow-red-500/30
                                                                `
                                                                : `
                                                                    bg-gradient-to-t
                                                                    from-sky-600
                                                                    via-sky-400
                                                                    to-cyan-300
                                                                    shadow-sky-500/10
                                                                `
                                                    }
                                                `}
                                                style={{
                                                    height:
                                                        `${value}px`,
                                                }}
                                            />

                                            {isActive &&
                                                !isSorted && (

                                                    <div
                                                        className="
                                                            absolute
                                                            bottom-0
                                                            left-1/2
                                                            -translate-x-1/2
                                                            w-[2px]
                                                            bg-red-500
                                                            shadow-[0_0_8px_rgba(239,68,68,0.9)]
                                                            z-20
                                                        "
                                                        style={{
                                                            height:
                                                                "100%",
                                                        }}
                                                    />

                                                )}

                                        </div>
                                    );
                                }
                            )}

                        </div>

                        {/* PAUSADO */}

                        {isPaused && (

                            <div className="
                                absolute
                                inset-0
                                z-30
                                flex
                                items-center
                                justify-center
                            ">

                                <div className="
                                    flex
                                    flex-col
                                    sm:flex-row
                                    items-stretch
                                    sm:items-center
                                    gap-2
                                    px-3
                                    py-3
                                    rounded-xl
                                    bg-slate-900/95
                                    border
                                    border-slate-700
                                    shadow-xl
                                ">

                                    <div className="
                                        flex
                                        items-center
                                        gap-2
                                        px-2
                                        sm:px-3
                                        py-1
                                    ">

                                        <div className="
                                            w-7
                                            h-7
                                            rounded-lg
                                            bg-orange-500/10
                                            border
                                            border-orange-500/20
                                            flex
                                            items-center
                                            justify-center
                                            text-orange-400
                                            shrink-0
                                        ">

                                            <Pause
                                                size={15}
                                                strokeWidth={2.5}
                                            />

                                        </div>

                                        <div className="leading-tight">

                                            <p className="
                                                text-xs
                                                font-semibold
                                                text-orange-400
                                            ">
                                                Pausado
                                            </p>

                                            <p className="
                                                hidden
                                                sm:block
                                                text-[10px]
                                                text-slate-500
                                                mt-0.5
                                            ">
                                                Ordenamiento detenido
                                            </p>

                                        </div>

                                    </div>

                                    <div className="
                                        hidden
                                        sm:block
                                        w-px
                                        h-7
                                        bg-slate-700
                                    " />

                                    <div className="
                                        flex
                                        items-center
                                        gap-2
                                    ">

                                        <button
                                            onClick={
                                                continueSorting
                                            }
                                            className="
                                                h-9
                                                px-3
                                                rounded-lg
                                                bg-green-500
                                                hover:bg-green-400
                                                text-slate-950
                                                text-xs
                                                font-bold
                                                transition
                                                flex
                                                items-center
                                                justify-center
                                                gap-1.5
                                            "
                                        >

                                            <Play
                                                size={14}
                                                fill="currentColor"
                                            />

                                            Continuar

                                        </button>

                                        <button
                                            onClick={
                                                stopAndRestart
                                            }
                                            className="
                                                h-9
                                                px-3
                                                rounded-lg
                                                bg-slate-800
                                                hover:bg-red-500
                                                border
                                                border-slate-700
                                                hover:border-red-400
                                                text-slate-300
                                                hover:text-white
                                                text-xs
                                                font-semibold
                                                transition
                                                flex
                                                items-center
                                                justify-center
                                                gap-1.5
                                            "
                                        >

                                            <Square
                                                size={13}
                                                fill="currentColor"
                                            />

                                            Reiniciar

                                        </button>

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* COMPLETADO */}

                        {isSorted && (

                            <div className="
                                absolute
                                top-3
                                sm:top-4
                                left-1/2
                                -translate-x-1/2
                            ">

                                <div className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-4
                                    sm:px-5
                                    py-2
                                    rounded-full
                                    bg-green-500/10
                                    border
                                    border-green-500/30
                                    text-green-400
                                    text-xs
                                    sm:text-sm
                                    font-semibold
                                    backdrop-blur
                                    whitespace-nowrap
                                ">

                                    <Check size={15} />

                                    ¡Ordenamiento completado!

                                </div>

                            </div>
                        )}

                    </div>

                </div>

                {/* ESTADISTICAS */}

                <div className="
                    px-3
                    sm:px-6
                    pb-4
                    sm:pb-6
                ">

                    <div className="
                        grid
                        grid-cols-3
                        gap-2
                        sm:gap-3
                        md:gap-4
                    ">

                        {/* COMPARACIONES */}

                        <div className="
                            bg-slate-950
                            border
                            border-slate-800
                            rounded-xl
                            sm:rounded-2xl
                            p-2.5
                            sm:p-4
                            md:p-5
                        ">

                            <div className="
                                flex
                                items-center
                                justify-between
                                gap-1
                            ">

                                <div className="
                                    min-w-0
                                ">

                                    <p className="
                                        text-[9px]
                                        sm:text-xs
                                        md:text-sm
                                        text-slate-500
                                        truncate
                                    ">
                                        Comparaciones
                                    </p>

                                    <p className="
                                        text-base
                                        sm:text-2xl
                                        md:text-3xl
                                        font-bold
                                        mt-0.5
                                        sm:mt-1
                                    ">
                                        {comparisons}
                                    </p>

                                </div>

                                <div className="
                                    w-7
                                    h-7
                                    sm:w-9
                                    sm:h-9
                                    md:w-11
                                    md:h-11
                                    shrink-0
                                    rounded-lg
                                    sm:rounded-xl
                                    bg-blue-500/10
                                    flex
                                    items-center
                                    justify-center
                                    text-blue-400
                                ">

                                    <Search
                                        size={14}
                                        className="
                                            sm:w-[17px]
                                            sm:h-[17px]
                                            md:w-[21px]
                                            md:h-[21px]
                                        "
                                        strokeWidth={2}
                                    />

                                </div>

                            </div>

                        </div>

                        {/* MOVIMIENTOS */}

                        <div className="
                            bg-slate-950
                            border
                            border-slate-800
                            rounded-xl
                            sm:rounded-2xl
                            p-2.5
                            sm:p-4
                            md:p-5
                        ">

                            <div className="
                                flex
                                items-center
                                justify-between
                                gap-1
                            ">

                                <div className="
                                    min-w-0
                                ">

                                    <p className="
                                        text-[9px]
                                        sm:text-xs
                                        md:text-sm
                                        text-slate-500
                                        truncate
                                    ">
                                        Movimientos
                                    </p>

                                    <p className="
                                        text-base
                                        sm:text-2xl
                                        md:text-3xl
                                        font-bold
                                        mt-0.5
                                        sm:mt-1
                                    ">
                                        {swaps}
                                    </p>

                                </div>

                                <div className="
                                    w-7
                                    h-7
                                    sm:w-9
                                    sm:h-9
                                    md:w-11
                                    md:h-11
                                    shrink-0
                                    rounded-lg
                                    sm:rounded-xl
                                    bg-purple-500/10
                                    flex
                                    items-center
                                    justify-center
                                    text-purple-400
                                ">

                                    <ArrowLeftRight
                                        size={14}
                                        className="
                                            sm:w-[17px]
                                            sm:h-[17px]
                                            md:w-[21px]
                                            md:h-[21px]
                                        "
                                        strokeWidth={2}
                                    />

                                </div>

                            </div>

                        </div>

                        {/* ELEMENTOS */}

                        <div className="
                            bg-slate-950
                            border
                            border-slate-800
                            rounded-xl
                            sm:rounded-2xl
                            p-2.5
                            sm:p-4
                            md:p-5
                        ">

                            <div className="
                                flex
                                items-center
                                justify-between
                                gap-1
                            ">

                                <div className="
                                    min-w-0
                                ">

                                    <p className="
                                        text-[9px]
                                        sm:text-xs
                                        md:text-sm
                                        text-slate-500
                                        truncate
                                    ">
                                        Elementos
                                    </p>

                                    <p className="
                                        text-base
                                        sm:text-2xl
                                        md:text-3xl
                                        font-bold
                                        mt-0.5
                                        sm:mt-1
                                    ">
                                        {data.length}
                                    </p>

                                </div>

                                <div className="
                                    w-7
                                    h-7
                                    sm:w-9
                                    sm:h-9
                                    md:w-11
                                    md:h-11
                                    shrink-0
                                    rounded-lg
                                    sm:rounded-xl
                                    bg-cyan-500/10
                                    flex
                                    items-center
                                    justify-center
                                    text-cyan-400
                                ">

                                    <BarChart3
                                        size={14}
                                        className="
                                            sm:w-[17px]
                                            sm:h-[17px]
                                            md:w-[21px]
                                            md:h-[21px]
                                        "
                                        strokeWidth={2}
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* CONTROLES */}

                <div className="
                    border-t
                    border-slate-800
                    bg-slate-950/50
                    px-4
                    sm:px-6
                    py-5
                    sm:py-6
                ">

                    <div className="
                        grid
                        grid-cols-1
                        md:grid-cols-2
                        lg:grid-cols-5
                        gap-3
                        sm:gap-4
                    ">

                        {/* GENERAR */}

                        <button
                            onClick={
                                generateData
                            }
                            disabled={
                                isSorting
                            }
                            className="
                                h-11
                                sm:h-12
                                rounded-xl
                                border
                                border-slate-700
                                bg-slate-900
                                hover:bg-slate-800
                                hover:border-slate-600
                                transition
                                font-medium
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                                flex
                                items-center
                                justify-center
                                gap-2
                                text-sm
                                sm:text-base
                            "
                        >

                            <RotateCcw
                                size={17}
                            />

                            Generar datos

                        </button>

                        {/* ORDENAR / PAUSAR */}

                        {!isSorting ? (

                            <button
                                onClick={sort}
                                disabled={
                                    data.length === 0
                                }
                                className="
                                    h-11
                                    sm:h-12
                                    rounded-xl
                                    bg-sky-500
                                    hover:bg-sky-400
                                    text-slate-950
                                    font-bold
                                    transition
                                    shadow-lg
                                    shadow-sky-500/20
                                    disabled:opacity-40
                                    disabled:cursor-not-allowed
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    text-sm
                                    sm:text-base
                                "
                            >

                                <Zap
                                    size={18}
                                    fill="currentColor"
                                />

                                {isSorted
                                    ? "Ordenar nuevamente"
                                    : "Ordenar"
                                }

                            </button>

                        ) : (

                            <button
                                onClick={
                                    pauseSorting
                                }
                                disabled={
                                    isPaused
                                }
                                className="
                                    h-11
                                    sm:h-12
                                    rounded-xl
                                    bg-orange-500
                                    hover:bg-orange-400
                                    text-slate-950
                                    font-bold
                                    transition
                                    shadow-lg
                                    shadow-orange-500/20
                                    disabled:opacity-50
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    text-sm
                                    sm:text-base
                                "
                            >

                                <Pause
                                    size={18}
                                    fill="currentColor"
                                />

                                Pausar

                            </button>
                        )}

                        {/* ALGORITMO */}

                        <div className="
                            relative
                        ">

                            <select
                                value={algorithm}
                                disabled={isSorting}
                                onChange={
                                    handleAlgorithmChange
                                }
                                className="
                                    w-full
                                    h-11
                                    sm:h-12
                                    appearance-none
                                    rounded-xl
                                    border
                                    border-slate-700
                                    bg-slate-900
                                    px-4
                                    pr-10
                                    text-white
                                    outline-none
                                    focus:border-sky-500
                                    transition
                                    cursor-pointer
                                    text-sm
                                    sm:text-base
                                "
                            >

                                <option>
                                    Quick Sort
                                </option>

                                <option>
                                    Bubble Sort
                                </option>

                                <option>
                                    Insertion Sort
                                </option>

                                <option>
                                    Selection Sort
                                </option>

                                <option>
                                    Merge Sort
                                </option>

                            </select>

                            <ChevronDown
                                size={18}
                                className="
                                    absolute
                                    right-4
                                    top-3
                                    sm:top-3.5
                                    pointer-events-none
                                    text-slate-400
                                "
                            />

                        </div>

                        {/* CANTIDAD */}

                        <div className="
                            h-11
                            sm:h-12
                            rounded-xl
                            border
                            border-slate-700
                            bg-slate-900
                            px-3
                            sm:px-4
                            flex
                            items-center
                            gap-2
                            sm:gap-3
                        ">

                            <BarChart3
                                size={16}
                                className="text-slate-400"
                            />

                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={barCount}
                                disabled={isSorting}
                                onChange={
                                    handleBarCountChange
                                }
                                className="
                                    w-full
                                    accent-purple-400
                                    cursor-pointer
                                "
                            />

                            <span className="
                                text-xs
                                text-slate-400
                                whitespace-nowrap
                            ">
                                {barCount}
                            </span>

                        </div>

                        {/* VELOCIDAD */}

                        <div className="
                            h-11
                            sm:h-12
                            rounded-xl
                            border
                            border-slate-700
                            bg-slate-900
                            px-3
                            sm:px-4
                            flex
                            items-center
                            gap-2
                            sm:gap-3
                        ">

                            <Turtle
                                size={17}
                                className="text-slate-400"
                            />

                            <input
                                type="range"
                                min="10"
                                max="500"
                                value={speed}
                                disabled={isSorting}
                                onChange={(e) =>
                                    setSpeed(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="
                                    w-full
                                    accent-sky-400
                                    cursor-pointer
                                "
                            />

                            <span className="
                                text-xs
                                text-slate-400
                                whitespace-nowrap
                            ">
                                {speed}ms
                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* INFORMACION */}

            <div className="
                mt-5
                sm:mt-6
                grid
                grid-cols-1
                md:grid-cols-3
                gap-3
                sm:gap-4
            ">

                <div className="
                    p-4
                    sm:p-5
                    rounded-2xl
                    bg-slate-900
                    border
                    border-slate-800
                ">

                    <p className="
                        text-xs
                        text-slate-500
                        uppercase
                        tracking-wider
                    ">
                        Complejidad promedio
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-sky-400
                        mt-2
                    ">
                        {algorithmInfo.average}
                    </p>

                    <p className="
                        text-sm
                        text-slate-500
                        mt-1
                    ">
                        {algorithm}
                    </p>

                </div>

                <div className="
                    p-4
                    sm:p-5
                    rounded-2xl
                    bg-slate-900
                    border
                    border-slate-800
                ">

                    <p className="
                        text-xs
                        text-slate-500
                        uppercase
                        tracking-wider
                    ">
                        Peor caso
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-orange-400
                        mt-2
                    ">
                        {algorithmInfo.worst}
                    </p>

                    <p className="
                        text-sm
                        text-slate-500
                        mt-1
                    ">
                        Complejidad máxima
                    </p>

                </div>

                <div className="
                    p-4
                    sm:p-5
                    rounded-2xl
                    bg-slate-900
                    border
                    border-slate-800
                ">

                    <p className="
                        text-xs
                        text-slate-500
                        uppercase
                        tracking-wider
                    ">
                        Rendimiento
                    </p>

                    <p className="
                        text-2xl
                        font-bold
                        text-green-400
                        mt-2
                    ">
                        {algorithmInfo.performance}
                    </p>

                    <p className="
                        text-sm
                        text-slate-500
                        mt-1
                    ">
                        {algorithmInfo.description}
                    </p>

                </div>

            </div>

        </div>
    );
}

export default SortingVisualizer;