import * as admin from "firebase-admin";

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn().mockReturnThis(),
    add: jest.fn().mockResolvedValue({ id: "mock-report-id" }),
  })),
}));

const { submitReport } = require("./submitReport");

describe("submitReport", () => {
  test("TODO: write tests", async () => {
    // implement
  });
});
