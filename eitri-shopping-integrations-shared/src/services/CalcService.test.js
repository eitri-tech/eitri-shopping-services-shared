import CalcService from "./CalcService";

describe("CalcService", () => {

    test("addition", () => {
        const result = CalcService.addition(5, 15)
        console.log("result", result)
        expect(result).toBe(20)
    })

    test("subtraction", () => {
        const result = CalcService.subtraction(15, 35)
        expect(result).toBe(-20)
    })

    test("multiplication", () => {
        const result = CalcService.multiplication(7, 85)
        expect(result).toBe(595)
    })

    test("division", () => {
        const result = CalcService.division(100, 4)
        expect(result).toBe(25)
    })

})