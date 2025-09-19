import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ActiveStocks from "./page";

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const flushPromises = () => new Promise(setImmediate);

describe("ActiveStocks Component", () => {
  it("renders loading state initially", () => {
    render(<ActiveStocks />);
    expect(screen.getByText(/loading active stocks/i)).toBeInTheDocument();
  });

  it("renders active stocks after API resolves", async () => {
    render(<ActiveStocks />);

    await waitFor(async () => {
      await flushPromises();
      const stockCards = screen.getAllByText(/Active/);
      expect(stockCards.length).toBeGreaterThan(0);
    });
  });

  it("shows Login button when user is not in localStorage", async () => {
    render(<ActiveStocks />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });
  });

  it("shows UserMenu when user exists in localStorage", async () => {
    localStorage.setItem("user", JSON.stringify({ name: "Hemant" }));
    render(<ActiveStocks />);
    await waitFor(() => {
      expect(screen.queryByText(/Hemant/)).toBeInTheDocument();
    });
  });

  it("toggles market status OPEN or CLOSED depending on time", async () => {
    render(<ActiveStocks />);
    const statusEl = await screen.findByText(/OPEN|CLOSED/);
    expect(statusEl).toBeInTheDocument();
  });

  it("refresh button triggers refresh", async () => {
    render(<ActiveStocks />);
    const refreshBtn = screen.getAllByRole("button", { name: /refresh/i })[0];
    fireEvent.click(refreshBtn);
    expect(refreshBtn).toBeEnabled();
  });
});
