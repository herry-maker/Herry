#!/usr/bin/env python3
"""
Classical Guitar Case Study - Data Analysis Module
Analyzes diploma student performance data across 4-year semester program
Author: Herry-maker
Date: May 26, 2026
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json
import os

class GuitarStudentDataAnalyzer:
    """
    Main class for analyzing classical guitar student performance data
    """
    
    def __init__(self, data_file=None):
        """
        Initialize the analyzer
        
        Parameters:
        -----------
        data_file : str
            Path to CSV file containing student performance data
        """
        self.data = None
        self.data_file = data_file
        self.student_profiles = {}
        self.semester_stats = {}
        
    def load_data(self, filepath):
        """
        Load student performance data from CSV file
        
        Parameters:
        -----------
        filepath : str
            Path to CSV file
            
        Returns:
        --------
        pd.DataFrame
            Loaded dataframe
        """
        try:
            self.data = pd.read_csv(filepath)
            print(f"✓ Data loaded successfully from {filepath}")
            print(f"  Records: {len(self.data)}")
            print(f"  Columns: {list(self.data.columns)}")
            return self.data
        except FileNotFoundError:
            print(f"✗ Error: File not found - {filepath}")
            return None
        except Exception as e:
            print(f"✗ Error loading data: {str(e)}")
            return None
    
    def validate_data(self):
        """
        Validate data structure and required columns
        
        Returns:
        --------
        bool
            True if data is valid
        """
        required_columns = [
            'student_id', 'student_name', 'semester', 'year',
            'technical_score', 'artistic_score', 'performance_score',
            'concierto_title', 'composer'
        ]
        
        if self.data is None:
            print("✗ No data loaded")
            return False
        
        missing_cols = [col for col in required_columns if col not in self.data.columns]
        
        if missing_cols:
            print(f"✗ Missing required columns: {missing_cols}")
            return False
        
        print("✓ Data validation passed")
        return True
    
    def calculate_semester_statistics(self):
        """
        Calculate aggregate statistics by semester
        
        Returns:
        --------
        dict
            Semester-level statistics
        """
        self.semester_stats = {}
        
        for semester in self.data['semester'].unique():
            semester_data = self.data[self.data['semester'] == semester]
            
            stats = {
                'semester': semester,
                'num_students': len(semester_data['student_id'].unique()),
                'avg_technical': semester_data['technical_score'].mean(),
                'avg_artistic': semester_data['artistic_score'].mean(),
                'avg_performance': semester_data['performance_score'].mean(),
                'avg_total': (semester_data['technical_score'].mean() + 
                             semester_data['artistic_score'].mean() + 
                             semester_data['performance_score'].mean()),
                'std_technical': semester_data['technical_score'].std(),
                'std_artistic': semester_data['artistic_score'].std(),
                'std_performance': semester_data['performance_score'].std(),
                'min_total': (semester_data['technical_score'].min() + 
                             semester_data['artistic_score'].min() + 
                             semester_data['performance_score'].min()),
                'max_total': (semester_data['technical_score'].max() + 
                             semester_data['artistic_score'].max() + 
                             semester_data['performance_score'].max()),
            }
            
            self.semester_stats[semester] = stats
        
        return self.semester_stats
    
    def display_semester_summary(self):
        """
        Display summary statistics by semester
        """
        print("\n" + "="*80)
        print("SEMESTER PERFORMANCE SUMMARY")
        print("="*80)
        
        if not self.semester_stats:
            self.calculate_semester_statistics()
        
        for semester in sorted(self.semester_stats.keys()):
            stats = self.semester_stats[semester]
            print(f"\nSemester: {semester}")
            print(f"  Students: {stats['num_students']}")
            print(f"  Technical Score (Avg): {stats['avg_technical']:.2f} ± {stats['std_technical']:.2f}")
            print(f"  Artistic Score (Avg): {stats['avg_artistic']:.2f} ± {stats['std_artistic']:.2f}")
            print(f"  Performance Score (Avg): {stats['avg_performance']:.2f} ± {stats['std_performance']:.2f}")
            print(f"  Total Score Range: {stats['min_total']:.2f} - {stats['max_total']:.2f}")
    
    def identify_student_types(self):
        """
        Classify students by trajectory type
        
        Returns:
        --------
        dict
            Student classifications
        """
        student_types = {
            'linear_progressors': [],
            'breakthrough_performers': [],
            'variable_performers': [],
            'exceptional_performers': []
        }
        
        for student_id in self.data['student_id'].unique():
            student_data = self.data[self.data['student_id'] == student_id].sort_values('semester')
            
            if len(student_data) < 2:
                continue
            
            # Calculate scores
            scores = student_data['technical_score'].values + \
                     student_data['artistic_score'].values + \
                     student_data['performance_score'].values
            
            # Calculate progression
            early_scores = scores[:len(scores)//2]  # First half
            late_scores = scores[len(scores)//2:]   # Second half
            
            early_avg = np.mean(early_scores)
            late_avg = np.mean(late_scores)
            improvement = late_avg - early_avg
            
            # Calculate consistency
            consistency = np.std(scores)
            
            # Classify
            if late_avg > 80 and abs(improvement) < 5 and consistency < 8:
                # Linear Progressor
                student_types['linear_progressors'].append({
                    'student_id': student_id,
                    'score': late_avg,
                    'improvement': improvement
                })
            elif improvement > 15 and len(student_data) >= 4:
                # Breakthrough Performer
                student_types['breakthrough_performers'].append({
                    'student_id': student_id,
                    'score': late_avg,
                    'improvement': improvement
                })
            elif consistency > 12:
                # Variable Performer
                student_types['variable_performers'].append({
                    'student_id': student_id,
                    'score': late_avg,
                    'consistency': consistency
                })
            elif late_avg > 85:
                # Exceptional Performer
                student_types['exceptional_performers'].append({
                    'student_id': student_id,
                    'score': late_avg,
                    'early_average': early_avg
                })
        
        self.student_profiles = student_types
        return student_types
    
    def display_student_types(self):
        """
        Display classified student types
        """
        print("\n" + "="*80)
        print("STUDENT TRAJECTORY CLASSIFICATION")
        print("="*80)
        
        if not self.student_profiles:
            self.identify_student_types()
        
        total_students = sum(len(v) for v in self.student_profiles.values())
        
        print(f"\nTotal Students Analyzed: {total_students}\n")
        
        print(f"Type A - Linear Progressors: {len(self.student_profiles['linear_progressors'])}")
        print(f"  ({len(self.student_profiles['linear_progressors'])/total_students*100:.1f}% of cohort)")
        print(f"  Characteristic: Steady improvement across all semesters")
        
        print(f"\nType B - Breakthrough Performers: {len(self.student_profiles['breakthrough_performers'])}")
        print(f"  ({len(self.student_profiles['breakthrough_performers'])/total_students*100:.1f}% of cohort)")
        print(f"  Characteristic: Sudden significant improvement mid-program")
        
        print(f"\nType C - Variable Performers: {len(self.student_profiles['variable_performers'])}")
        print(f"  ({len(self.student_profiles['variable_performers'])/total_students*100:.1f}% of cohort)")
        print(f"  Characteristic: Inconsistent progress with plateaus")
        
        print(f"\nType D - Exceptional Performers: {len(self.student_profiles['exceptional_performers'])}")
        print(f"  ({len(self.student_profiles['exceptional_performers'])/total_students*100:.1f}% of cohort)")
        print(f"  Characteristic: Rapid advancement throughout program")
    
    def calculate_individual_progression(self, student_id):
        """
        Calculate progression metrics for individual student
        
        Parameters:
        -----------
        student_id : str
            Student identifier
            
        Returns:
        --------
        dict
            Progression data
        """
        student_data = self.data[self.data['student_id'] == student_id].sort_values('semester')
        
        if len(student_data) == 0:
            return None
        
        total_scores = (student_data['technical_score'].values + 
                       student_data['artistic_score'].values + 
                       student_data['performance_score'].values)
        
        progression = {
            'student_id': student_id,
            'semesters': student_data['semester'].tolist(),
            'technical_scores': student_data['technical_score'].tolist(),
            'artistic_scores': student_data['artistic_score'].tolist(),
            'performance_scores': student_data['performance_score'].tolist(),
            'total_scores': total_scores.tolist(),
            'avg_score': np.mean(total_scores),
            'final_score': total_scores[-1] if len(total_scores) > 0 else None,
            'improvement': total_scores[-1] - total_scores[0] if len(total_scores) > 1 else None,
            'trend': 'improving' if len(total_scores) > 1 and total_scores[-1] > total_scores[0] else 'stable/declining'
        }
        
        return progression
    
    def export_analysis_report(self, output_file='guitar_analysis_report.txt'):
        """
        Generate comprehensive analysis report
        
        Parameters:
        -----------
        output_file : str
            Output file path
        """
        with open(output_file, 'w') as f:
            f.write("="*80 + "\n")
            f.write("CLASSICAL GUITAR CASE STUDY - DATA ANALYSIS REPORT\n")
            f.write("="*80 + "\n\n")
            f.write(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Summary statistics
            f.write("DATASET OVERVIEW\n")
            f.write("-"*80 + "\n")
            f.write(f"Total Records: {len(self.data)}\n")
            f.write(f"Unique Students: {self.data['student_id'].nunique()}\n")
            f.write(f"Semesters Covered: {sorted(self.data['semester'].unique())}\n")
            f.write(f"Years Covered: {sorted(self.data['year'].unique())}\n\n")
            
            # Semester summary
            f.write("SEMESTER PERFORMANCE SUMMARY\n")
            f.write("-"*80 + "\n")
            if not self.semester_stats:
                self.calculate_semester_statistics()
            
            for semester in sorted(self.semester_stats.keys()):
                stats = self.semester_stats[semester]
                f.write(f"\nSemester {semester}:\n")
                f.write(f"  Students: {stats['num_students']}\n")
                f.write(f"  Technical Score: {stats['avg_technical']:.2f} ± {stats['std_technical']:.2f}\n")
                f.write(f"  Artistic Score: {stats['avg_artistic']:.2f} ± {stats['std_artistic']:.2f}\n")
                f.write(f"  Performance Score: {stats['avg_performance']:.2f} ± {stats['std_performance']:.2f}\n")
                f.write(f"  Score Range: {stats['min_total']:.2f} - {stats['max_total']:.2f}\n")
            
            # Student types
            f.write("\n\nSTUDENT TRAJECTORY CLASSIFICATION\n")
            f.write("-"*80 + "\n")
            if not self.student_profiles:
                self.identify_student_types()
            
            total_students = sum(len(v) for v in self.student_profiles.values())
            f.write(f"Total Students: {total_students}\n\n")
            f.write(f"Type A - Linear Progressors: {len(self.student_profiles['linear_progressors'])} ({len(self.student_profiles['linear_progressors'])/total_students*100:.1f}%)\n")
            f.write(f"Type B - Breakthrough Performers: {len(self.student_profiles['breakthrough_performers'])} ({len(self.student_profiles['breakthrough_performers'])/total_students*100:.1f}%)\n")
            f.write(f"Type C - Variable Performers: {len(self.student_profiles['variable_performers'])} ({len(self.student_profiles['variable_performers'])/total_students*100:.1f}%)\n")
            f.write(f"Type D - Exceptional Performers: {len(self.student_profiles['exceptional_performers'])} ({len(self.student_profiles['exceptional_performers'])/total_students*100:.1f}%)\n")
        
        print(f"✓ Report exported to: {output_file}")
    
    def export_json(self, output_file='guitar_analysis_data.json'):
        """
        Export analysis results to JSON
        
        Parameters:
        -----------
        output_file : str
            Output file path
        """
        export_data = {
            'metadata': {
                'generated': datetime.now().isoformat(),
                'total_records': len(self.data),
                'unique_students': int(self.data['student_id'].nunique())
            },
            'semester_statistics': self.semester_stats,
            'student_classifications': self.student_profiles
        }
        
        with open(output_file, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print(f"✓ Analysis data exported to: {output_file}")


# Sample usage functions
def create_sample_data(output_file='sample_student_data.csv'):
    """
    Create sample data for demonstration
    
    Parameters:
    -----------
    output_file : str
        Output CSV file path
    """
    np.random.seed(42)
    
    data = []
    students = [f"STU{i:03d}" for i in range(1, 21)]  # 20 students
    
    for student_id in students:
        for year in range(1, 5):
            for sem in range(1, 3):
                semester = (year - 1) * 2 + sem
                
                # Simulate progression
                base_score = 50 + (semester * 5)
                noise = np.random.normal(0, 3)
                
                technical = max(20, min(40, base_score + noise))
                artistic = max(20, min(40, base_score + noise - 2))
                performance = max(10, min(30, base_score + noise - 1))
                
                data.append({
                    'student_id': student_id,
                    'student_name': f"Student {student_id}",
                    'semester': semester,
                    'year': year,
                    'technical_score': round(technical, 2),
                    'artistic_score': round(artistic, 2),
                    'performance_score': round(performance, 2),
                    'concierto_title': f"Concierto-{semester}",
                    'composer': f"Composer-{semester}",
                    'venue': 'School Concert Hall'
                })
    
    df = pd.DataFrame(data)
    df.to_csv(output_file, index=False)
    print(f"✓ Sample data created: {output_file}")
    return df


# Main execution
if __name__ == "__main__":
    print("Classical Guitar Case Study - Data Analysis Module")
    print("="*80)
    
    # Create sample data if not exists
    if not os.path.exists('sample_student_data.csv'):
        create_sample_data()
    
    # Initialize analyzer
    analyzer = GuitarStudentDataAnalyzer()
    
    # Load data
    analyzer.load_data('sample_student_data.csv')
    
    # Validate
    if analyzer.validate_data():
        # Calculate statistics
        analyzer.calculate_semester_statistics()
        analyzer.display_semester_summary()
        
        # Identify student types
        analyzer.identify_student_types()
        analyzer.display_student_types()
        
        # Export reports
        analyzer.export_analysis_report()
        analyzer.export_json()
        
        print("\n✓ Analysis complete!")
