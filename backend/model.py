import numpy as np
from sklearn.linear_model import LinearRegression

def train_model(prices:list):
    X = np.array(range(len(prices))).reshape(-1, 1)
    y = np.array(prices).reshape(-1, 1)

    model = LinearRegression()
    model.fit(X, y)

    next_day = np.array([[len(prices)]])
    prediction_price = model.predict(next_day)
    return prediction_price[0][0]