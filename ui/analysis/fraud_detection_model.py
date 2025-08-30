import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

class FraudDetectionModel:
    def __init__(self):
        self.thresholds = {
            'high_velocity_window': 300,  # 5 minutes
            'high_velocity_count': 3,
            'large_amount_threshold': 1000000000,  # 1B units
            'off_hours_start': 22,
            'off_hours_end': 6,
            'round_amount_threshold': 1000000  # 1M units
        }
        
    def prepare_data(self, transactions: List[Dict]) -> pd.DataFrame:
        """Convert transaction list to DataFrame with proper types"""
        df = pd.DataFrame(transactions)
        df['createdAt'] = pd.to_datetime(df['createdAt'], unit='ms')
        df['amount'] = df['amount'].astype(float)
        return df.sort_values('createdAt')
    
    def calculate_user_features(self, df: pd.DataFrame, user_id: str) -> Dict:
        """Calculate features for a specific user"""
        # Get all transactions involving this user
        user_txns = df[
            (df['senderId'] == user_id) | 
            (df['receiverId'] == user_id) |
            (df['owner'] == user_id)
        ].copy()
        
        if len(user_txns) == 0:
            return {'transaction_count': 0, 'fraud_score': 0}
        
        features = {}
        
        # Basic stats
        features['transaction_count'] = len(user_txns)
        features['total_amount'] = user_txns['amount'].sum()
        features['avg_amount'] = user_txns['amount'].mean()
        features['median_amount'] = user_txns['amount'].median()
        features['amount_std'] = user_txns['amount'].std()
        
        # Time-based features
        user_txns['hour'] = user_txns['createdAt'].dt.hour
        user_txns['day_of_week'] = user_txns['createdAt'].dt.dayofweek
        
        # Velocity features
        time_diffs = user_txns['createdAt'].diff().dt.total_seconds()
        features['avg_time_between_txns'] = time_diffs.mean()
        features['min_time_between_txns'] = time_diffs.min()
        
        # High velocity transactions (multiple within short window)
        rapid_count = 0
        for i in range(len(user_txns) - 1):
            window_end = user_txns.iloc[i]['createdAt'] + timedelta(seconds=self.thresholds['high_velocity_window'])
            window_txns = user_txns[
                (user_txns['createdAt'] >= user_txns.iloc[i]['createdAt']) &
                (user_txns['createdAt'] <= window_end)
            ]
            if len(window_txns) >= self.thresholds['high_velocity_count']:
                rapid_count += 1
        
        features['high_velocity_periods'] = rapid_count
        
        # Amount patterns
        features['round_amount_ratio'] = (
            user_txns['amount'] % self.thresholds['round_amount_threshold'] == 0
        ).mean()
        
        # Large transactions
        features['large_transaction_count'] = (
            user_txns['amount'] >= self.thresholds['large_amount_threshold']
        ).sum()
        
        # Off-hours activity
        off_hours_mask = (
            (user_txns['hour'] >= self.thresholds['off_hours_start']) |
            (user_txns['hour'] < self.thresholds['off_hours_end'])
        )
        features['off_hours_ratio'] = off_hours_mask.mean()
        
        # Transaction type diversity
        features['unique_transaction_types'] = user_txns['type'].nunique()
        features['transaction_type_entropy'] = self._calculate_entropy(
            user_txns['type'].value_counts()
        )
        
        # Network features
        senders = set(user_txns['senderId'].dropna())
        receivers = set(user_txns['receiverId'].dropna())
        features['unique_counterparties'] = len(senders.union(receivers)) - 1  # Exclude self
        features['circular_transactions'] = len(senders.intersection(receivers)) > 1
        
        # Amount outliers
        if features['amount_std'] > 0:
            z_scores = np.abs((user_txns['amount'] - features['avg_amount']) / features['amount_std'])
            features['amount_outliers'] = (z_scores > 3).sum()
        else:
            features['amount_outliers'] = 0
            
        return features
    
    def _calculate_entropy(self, value_counts):
        """Calculate entropy of a distribution"""
        if len(value_counts) <= 1:
            return 0
        
        probs = value_counts / value_counts.sum()
        return -np.sum(probs * np.log2(probs))
    
    def calculate_fraud_score(self, features: Dict) -> Tuple[float, Dict]:
        """Calculate fraud score based on features"""
        if features['transaction_count'] == 0:
            return 0.0, {}
        
        score = 0.0
        reasons = {}
        
        # High velocity scoring (0-25 points)
        if features['high_velocity_periods'] > 0:
            velocity_score = min(features['high_velocity_periods'] * 10, 25)
            score += velocity_score
            reasons['high_velocity'] = f"{features['high_velocity_periods']} rapid transaction periods"
        
        # Amount anomaly scoring (0-20 points)
        if features['amount_outliers'] > 0:
            outlier_score = min(features['amount_outliers'] * 5, 20)
            score += outlier_score
            reasons['amount_outliers'] = f"{features['amount_outliers']} transactions with unusual amounts"
        
        # Round amounts scoring (0-15 points)
        if features['round_amount_ratio'] > 0.5:
            round_score = features['round_amount_ratio'] * 15
            score += round_score
            reasons['round_amounts'] = f"{features['round_amount_ratio']:.1%} of amounts are round numbers"
        
        # Large transaction scoring (0-20 points)
        if features['large_transaction_count'] > 0:
            large_txn_ratio = features['large_transaction_count'] / features['transaction_count']
            large_score = min(large_txn_ratio * 20, 20)
            score += large_score
            reasons['large_transactions'] = f"{features['large_transaction_count']} very large transactions"
        
        # Off-hours activity scoring (0-15 points)
        if features['off_hours_ratio'] > 0.3:
            off_hours_score = features['off_hours_ratio'] * 15
            score += off_hours_score
            reasons['off_hours'] = f"{features['off_hours_ratio']:.1%} of transactions during off hours"
        
        # Circular transaction scoring (0-10 points)
        if features['circular_transactions']:
            score += 10
            reasons['circular_transactions'] = "Potential circular transaction patterns detected"
        
        # Low diversity scoring (0-5 points)
        if features['transaction_count'] > 5 and features['unique_counterparties'] <= 2:
            score += 5
            reasons['low_diversity'] = f"Only {features['unique_counterparties']} unique counterparties"
        
        return min(score, 100.0), reasons
    
    def evaluate_transactions(self, transactions: List[Dict]) -> Dict:
        """Main method to evaluate a list of transactions"""
        df = self.prepare_data(transactions)
        
        # Get all unique users
        all_users = set()
        for col in ['senderId', 'receiverId', 'owner']:
            if col in df.columns:
                all_users.update(df[col].dropna().unique())
        
        results = {}
        
        for user_id in all_users:
            features = self.calculate_user_features(df, user_id)
            if features['transaction_count'] > 0:
                fraud_score, reasons = self.calculate_fraud_score(features)
                results[user_id] = {
                    'fraud_score': fraud_score,
                    'risk_level': self._get_risk_level(fraud_score),
                    'reasons': reasons,
                    'features': features
                }
        
        # Overall transaction analysis
        overall_features = self._calculate_overall_features(df)
        overall_score, overall_reasons = self._calculate_overall_score(overall_features)
        
        return {
            'users': results,
            'overall': {
                'fraud_score': overall_score,
                'risk_level': self._get_risk_level(overall_score),
                'reasons': overall_reasons,
                'features': overall_features
            }
        }
    
    def _calculate_overall_features(self, df: pd.DataFrame) -> Dict:
        """Calculate features for the entire transaction set"""
        features = {}
        
        features['total_transactions'] = len(df)
        features['unique_users'] = len(set(df['senderId'].dropna()).union(set(df['receiverId'].dropna())))
        features['total_volume'] = df['amount'].sum()
        features['avg_transaction_size'] = df['amount'].mean()
        
        # Time span analysis
        time_span = (df['createdAt'].max() - df['createdAt'].min()).total_seconds()
        features['time_span_hours'] = time_span / 3600
        features['transaction_rate'] = len(df) / max(time_span / 3600, 0.01)  # per hour
        
        # Concentration analysis
        user_volumes = df.groupby('senderId')['amount'].sum()
        features['volume_concentration'] = (user_volumes.max() / user_volumes.sum()) if len(user_volumes) > 0 else 0
        
        return features
    
    def _calculate_overall_score(self, features: Dict) -> Tuple[float, Dict]:
        """Calculate overall fraud score for the transaction set"""
        score = 0.0
        reasons = {}
        
        # High transaction rate
        if features['transaction_rate'] > 10:  # More than 10 transactions per hour
            rate_score = min((features['transaction_rate'] - 10) * 2, 20)
            score += rate_score
            reasons['high_rate'] = f"High transaction rate: {features['transaction_rate']:.1f} per hour"
        
        # Volume concentration
        if features['volume_concentration'] > 0.8:
            conc_score = features['volume_concentration'] * 15
            score += conc_score
            reasons['concentration'] = f"High volume concentration: {features['volume_concentration']:.1%}"
        
        return min(score, 100.0), reasons
    
    def _get_risk_level(self, score: float) -> str:
        """Convert numeric score to risk level"""
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        elif score >= 20:
            return "LOW"
        else:
            return "MINIMAL"

# Example usage
def analyze_transactions(transactions_json):
    """Analyze transactions and return fraud assessment"""
    model = FraudDetectionModel()
    
    # If transactions_json is a string, parse it
    if isinstance(transactions_json, str):
        transactions = json.loads(transactions_json)
    else:
        transactions = transactions_json
    
    results = model.evaluate_transactions(transactions)
    
    # Print summary
    print("=== FRAUD DETECTION RESULTS ===")
    print(f"Overall Risk Level: {results['overall']['risk_level']}")
    print(f"Overall Fraud Score: {results['overall']['fraud_score']:.1f}/100")
    
    if results['overall']['reasons']:
        print("\nOverall Risk Factors:")
        for reason, detail in results['overall']['reasons'].items():
            print(f"  - {detail}")
    
    print(f"\nAnalyzed {len(results['users'])} users:")
    
    # Sort users by risk score
    high_risk_users = [(user_id, data) for user_id, data in results['users'].items() 
                      if data['fraud_score'] >= 40]
    
    if high_risk_users:
        high_risk_users.sort(key=lambda x: x[1]['fraud_score'], reverse=True)
        print("\nHigh-Risk Users:")
        for user_id, data in high_risk_users:
            print(f"  User {user_id}: {data['fraud_score']:.1f}/100 ({data['risk_level']})")
            for reason, detail in data['reasons'].items():
                print(f"    - {detail}")
    
    return results

# Run analysis on the provided data
if __name__ == "__main__":
    # Sample transaction data structure
    sample_transactions = [
    {
        "_creationTime": 1756519780195.7522,
        "_id": "k1701kf694qjpyg75rnxd8rynn7pm4wh",
        "amount": "100000000",
        "createdAt": 1756519780195,
        "giftId": "kd7awjacv40az1rqchh611m6hs7pkjkq",
        "livestreamId": "jx73chw30eanwtakm8ketbk7sh7pmsj7",
        "owner": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "receiverId": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "fee"
    },
    {
        "_creationTime": 1756519780195.752,
        "_id": "k1730m04e45m9fe3c88fasesc57pmtfp",
        "amount": "900000000",
        "createdAt": 1756519780195,
        "giftId": "kd7awjacv40az1rqchh611m6hs7pkjkq",
        "livestreamId": "jx73chw30eanwtakm8ketbk7sh7pmsj7",
        "owner": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-receive"
    },
    {
        "_creationTime": 1756519780195.7517,
        "_id": "k175x50brbptdygdefbdt0m9mx7pmm10",
        "amount": "1000000000",
        "createdAt": 1756519780195,
        "giftId": "kd7awjacv40az1rqchh611m6hs7pkjkq",
        "livestreamId": "jx73chw30eanwtakm8ketbk7sh7pmsj7",
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-give"
    },
    {
        "_creationTime": 1756518084111.8884,
        "_id": "k17b9wg0b6ecbv4rkavrv65jkd7pmhq0",
        "amount": "50000000",
        "createdAt": 1756518084115,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "receiverId": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "fee"
    },
    {
        "_creationTime": 1756518084111.8882,
        "_id": "k1746yzy9e4j7dsb7fc1y2wqrx7pnkzp",
        "amount": "450000000",
        "createdAt": 1756518084115,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-receive"
    },
    {
        "_creationTime": 1756518084111.888,
        "_id": "k177y7bc9mm09rcfbe8jg4tz2d7pma8a",
        "amount": "500000000",
        "createdAt": 1756518084115,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-give"
    },
    {
        "_creationTime": 1756517990737.2124,
        "_id": "k1781e4ctbywzna6nqrzrvcn197pngg3",
        "amount": "500000000",
        "createdAt": 1756517990737,
        "giftId": "kd7dcwh0mspz15b42sk4cctrpx7pj2dv",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "receiverId": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "fee"
    },
    {
        "_creationTime": 1756517990737.2122,
        "_id": "k17034qjkbxww9cpwzye83zsa97pmrw1",
        "amount": "4500000000",
        "createdAt": 1756517990737,
        "giftId": "kd7dcwh0mspz15b42sk4cctrpx7pj2dv",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-receive"
    },
    {
        "_creationTime": 1756517990737.212,
        "_id": "k179sy97j7rc6e3wk7c0582py17pnb7d",
        "amount": "5000000000",
        "createdAt": 1756517990737,
        "giftId": "kd7dcwh0mspz15b42sk4cctrpx7pj2dv",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-give"
    },
    {
        "_creationTime": 1756517975357.089,
        "_id": "k17bj3p80zb5mp6xapf5a8287n7pn1rx",
        "amount": "5000000",
        "createdAt": 1756517975360,
        "giftId": "kd7f2fy6ne3p0mw390rfaxfee97pjgah",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "receiverId": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "fee"
    },
    {
        "_creationTime": 1756517975357.0889,
        "_id": "k17bzwv4bh1gf18599nt13dqyh7pmwkx",
        "amount": "45000000",
        "createdAt": 1756517975360,
        "giftId": "kd7f2fy6ne3p0mw390rfaxfee97pjgah",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-receive"
    },
    {
        "_creationTime": 1756517975357.0886,
        "_id": "k176xb6hxv5afsb33eb0yzvndx7pmn2r",
        "amount": "50000000",
        "createdAt": 1756517975360,
        "giftId": "kd7f2fy6ne3p0mw390rfaxfee97pjgah",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-give"
    },
    {
        "_creationTime": 1756517912280.3235,
        "_id": "k17f4dn68ytj7hvw9nqfd924d17pnm58",
        "amount": "50000000",
        "createdAt": 1756517912284,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "receiverId": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "fee"
    },
    {
        "_creationTime": 1756517912280.3232,
        "_id": "k17eswxzhprh2w5mk0rfvf2cz97pmxr1",
        "amount": "450000000",
        "createdAt": 1756517912284,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-receive"
    },
    {
        "_creationTime": 1756517912280.323,
        "_id": "k179nyn88vjk4ggxanjy4v71p57pmcef",
        "amount": "500000000",
        "createdAt": 1756517912284,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-give"
    },
    {
        "_creationTime": 1756517733733.1501,
        "_id": "k17dged7ac3mvhjry2j3dr6shd7pmahj",
        "amount": "1000000",
        "createdAt": 1756517733737,
        "giftId": "kd7fm51h97rwj2jsxrwgph387n7pjrda",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "receiverId": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "fee"
    },
    {
        "_creationTime": 1756517733733.15,
        "_id": "k1751atz17dmw9z15sm8690xr57pmkk4",
        "amount": "9000000",
        "createdAt": 1756517733737,
        "giftId": "kd7fm51h97rwj2jsxrwgph387n7pjrda",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-receive"
    },
    {
        "_creationTime": 1756517733733.1497,
        "_id": "k17fvrs7dev8y248w8evgdayv97pm2mk",
        "amount": "10000000",
        "createdAt": 1756517733737,
        "giftId": "kd7fm51h97rwj2jsxrwgph387n7pjrda",
        "livestreamId": "jx75rhxqk0r262wjn3xstsyskx7pn7yq",
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-give"
    },
    {
        "_creationTime": 1756517587178.9946,
        "_id": "k170trg1pgbwwndtz5rpk7xhjn7pmvv3",
        "amount": "10000000000",
        "createdAt": 1756517587172,
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "senderId": "k570ypp1b5tyrf1py60ggkb43n7pjfe5",
        "status": "completed",
        "txHash": "0xcddfdb780abae4abcff534887447f82f93018983b4fc6b8c6ab5a172dff26fad",
        "type": "top-up"
    },
    {
        "_creationTime": 1756516277603.6995,
        "_id": "k170zcty8vmtt2an7yt9b8d6nd7pmwyq",
        "amount": "50000000",
        "createdAt": 1756516277603,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx7b0pjsgr71tyfst7rezh67rx7pm9gz",
        "owner": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "receiverId": "k5774ebjkaafqendyy4pstr1ys7pj6ga",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "fee"
    },
    {
        "_creationTime": 1756516277603.6992,
        "_id": "k17eg3t85t1tfg3k34rk0k7gdd7pn2h5",
        "amount": "450000000",
        "createdAt": 1756516277603,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx7b0pjsgr71tyfst7rezh67rx7pm9gz",
        "owner": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-receive"
    },
    {
        "_creationTime": 1756516277603.699,
        "_id": "k17933xhthbjn4qts51ysq3k817pnp56",
        "amount": "500000000",
        "createdAt": 1756516277603,
        "giftId": "kd7cf5w0y4vkarg9yr0xd5dqb97pkehf",
        "livestreamId": "jx7b0pjsgr71tyfst7rezh67rx7pm9gz",
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k575mjt0ebxy1fd7p6dpcep3kx7pk0rz",
        "senderId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "status": "completed",
        "type": "gift-give"
    },
    {
        "_creationTime": 1756516268143.4927,
        "_id": "k17cpztqrdz8xc5pk2a2zgnfxs7pmbse",
        "amount": "800000000",
        "createdAt": 1756516268134,
        "owner": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "receiverId": "k5773tawpex42z7p6wrr1sqbfx7pkbc4",
        "senderId": "k570ypp1b5tyrf1py60ggkb43n7pjfe5",
        "status": "completed",
        "txHash": "0x2c713592219d4afdc98b1d44e2cada14f9a54fab02c00ab6eff057c501f5b6b3",
        "type": "top-up"
    }
    ]
    
    results = analyze_transactions(sample_transactions)