"""
Data Processor for VidyutAI AI Service.
Handles data ingestion, preprocessing, and feature engineering.
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DataProcessor:
    """
    Processes energy data for analysis and model input.
    """
    
    def __init__(self):
        """Initialize the data processor."""
        logger.info("Initializing DataProcessor")
        self.feature_columns = [
            'value', 'hour', 'day_of_week', 'is_weekend', 
            'is_holiday', 'rolling_mean_24h', 'rolling_std_24h'
        ]
    
    def preprocess(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Preprocess raw energy data.
        
        Args:
            data: List of energy data points
            
        Returns:
            Preprocessed DataFrame
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame(data)
            
            # Convert timestamp to datetime
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Extract time features
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            
            # Add holiday feature (placeholder - would use a holiday calendar in production)
            df['is_holiday'] = 0
            
            # Sort by timestamp
            df = df.sort_values('timestamp')
            
            # Calculate rolling statistics if enough data
            if len(df) >= 24:
                df['rolling_mean_24h'] = df['value'].rolling(window=24).mean()
                df['rolling_std_24h'] = df['value'].rolling(window=24).std()
            else:
                # If not enough data, use simple statistics
                df['rolling_mean_24h'] = df['value'].mean()
                df['rolling_std_24h'] = df['value'].std() if len(df) > 1 else 0
            
            # Fill missing values
            df = df.fillna(method='ffill').fillna(method='bfill')
            
            return df
        
        except Exception as e:
            logger.error(f"Error in preprocessing data: {str(e)}")
            raise
    
    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features for model input.
        
        Args:
            df: Preprocessed DataFrame
            
        Returns:
            DataFrame with extracted features
        """
        try:
            # Select relevant columns
            features_df = df[self.feature_columns].copy()
            
            # Add any additional engineered features
            features_df['value_diff'] = features_df['value'] - features_df['rolling_mean_24h']
            features_df['value_normalized'] = (features_df['value'] - features_df['rolling_mean_24h']) / features_df['rolling_std_24h']
            features_df['value_normalized'].replace([np.inf, -np.inf], 0, inplace=True)
            
            # One-hot encode categorical features if needed
            # features_df = pd.get_dummies(features_df, columns=['day_of_week'], drop_first=True)
            
            return features_df
        
        except Exception as e:
            logger.error(f"Error in feature extraction: {str(e)}")
            raise
    
    def prepare_for_prediction(self, device_id: str, metric_type: str, horizon: int) -> pd.DataFrame:
        """
        Prepare data for prediction.
        
        Args:
            device_id: Device ID
            metric_type: Type of metric
            horizon: Prediction horizon in hours
            
        Returns:
            DataFrame prepared for prediction
        """
        try:
            # In a real implementation, this would fetch historical data
            # For now, create a placeholder DataFrame
            
            # Generate timestamps for the prediction horizon
            now = datetime.now()
            future_timestamps = [now + timedelta(hours=i) for i in range(horizon)]
            
            # Create DataFrame with future timestamps
            df = pd.DataFrame({
                'timestamp': future_timestamps,
                'device_id': device_id,
                'metric_type': metric_type
            })
            
            # Extract time features
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            df['is_holiday'] = 0  # Placeholder
            
            # Add placeholder values for other required features
            df['value'] = np.nan  # Will be predicted
            df['rolling_mean_24h'] = 100.0  # Placeholder
            df['rolling_std_24h'] = 10.0  # Placeholder
            
            return df
        
        except Exception as e:
            logger.error(f"Error in preparing data for prediction: {str(e)}")
            raise
    
    def format_results(self, predictions: np.ndarray, timestamps: List[datetime], 
                      device_id: str, metric_type: str) -> List[Dict[str, Any]]:
        """
        Format prediction results.
        
        Args:
            predictions: Array of predicted values
            timestamps: List of timestamps
            device_id: Device ID
            metric_type: Type of metric
            
        Returns:
            Formatted prediction results
        """
        try:
            results = []
            
            for i, timestamp in enumerate(timestamps):
                results.append({
                    'timestamp': timestamp.isoformat(),
                    'device_id': device_id,
                    'metric_type': metric_type,
                    'predicted_value': float(predictions[i])
                })
            
            return results
        
        except Exception as e:
            logger.error(f"Error in formatting results: {str(e)}")
            raise