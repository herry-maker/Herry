#!/usr/bin/env python3
"""
Classical Guitar Case Study - Visualization Module
Creates charts and graphs for student performance analysis
Author: Herry-maker
Date: May 26, 2026
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd
from datetime import datetime
import seaborn as sns

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 8)
plt.rcParams['font.size'] = 10

class GuitarDataVisualizer:
    """
    Create visualizations for classical guitar student data
    """
    
    def __init__(self, data):
        """
        Initialize visualizer with data
        
        Parameters:
        -----------
        data : pd.DataFrame
            Student performance data
        """
        self.data = data
        self.colors = {
            'linear': '#2E86AB',
            'breakthrough': '#A23B72',
            'variable': '#F18F01',
            'exceptional': '#C73E1D'
        }
    
    def plot_semester_progression(self, output_file='semester_progression.png'):
        """
        Create line plot showing average performance by semester
        
        Parameters:
        -----------
        output_file : str
            Output file path
        """
        fig, axes = plt.subplots(1, 3, figsize=(16, 5))
        
        semester_data = self.data.groupby('semester').agg({
            'technical_score': ['mean', 'std'],
            'artistic_score': ['mean', 'std'],
            'performance_score': ['mean', 'std']
        }).reset_index()
        
        # Technical scores
        axes[0].plot(semester_data['semester'], 
                     semester_data['technical_score']['mean'],
                     marker='o', linewidth=2, markersize=8, color=self.colors['linear'])
        axes[0].fill_between(semester_data['semester'],
                             semester_data['technical_score']['mean'] - semester_data['technical_score']['std'],
                             semester_data['technical_score']['mean'] + semester_data['technical_score']['std'],
                             alpha=0.2, color=self.colors['linear'])
        axes[0].set_title('Technical Score Progression', fontsize=12, fontweight='bold')
        axes[0].set_xlabel('Semester')
        axes[0].set_ylabel('Average Score (out of 40)')
        axes[0].grid(True, alpha=0.3)
        axes[0].set_xticks(range(1, 9))
        
        # Artistic scores
        axes[1].plot(semester_data['semester'],
                     semester_data['artistic_score']['mean'],
                     marker='s', linewidth=2, markersize=8, color=self.colors['breakthrough'])
        axes[1].fill_between(semester_data['semester'],
                             semester_data['artistic_score']['mean'] - semester_data['artistic_score']['std'],
                             semester_data['artistic_score']['mean'] + semester_data['artistic_score']['std'],
                             alpha=0.2, color=self.colors['breakthrough'])
        axes[1].set_title('Artistic Score Progression', fontsize=12, fontweight='bold')
        axes[1].set_xlabel('Semester')
        axes[1].set_ylabel('Average Score (out of 40)')
        axes[1].grid(True, alpha=0.3)
        axes[1].set_xticks(range(1, 9))
        
        # Performance scores
        axes[2].plot(semester_data['semester'],
                     semester_data['performance_score']['mean'],
                     marker='^', linewidth=2, markersize=8, color=self.colors['variable'])
        axes[2].fill_between(semester_data['semester'],
                             semester_data['performance_score']['mean'] - semester_data['performance_score']['std'],
                             semester_data['performance_score']['mean'] + semester_data['performance_score']['std'],
                             alpha=0.2, color=self.colors['variable'])
        axes[2].set_title('Performance Score Progression', fontsize=12, fontweight='bold')
        axes[2].set_xlabel('Semester')
        axes[2].set_ylabel('Average Score (out of 30)')
        axes[2].grid(True, alpha=0.3)
        axes[2].set_xticks(range(1, 9))
        
        plt.suptitle('Classical Guitar Student Performance Across 4-Year Program', 
                     fontsize=14, fontweight='bold', y=1.02)
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✓ Semester progression chart saved: {output_file}")
        plt.close()
    
    def plot_student_trajectory_types(self, analyzer_profiles, output_file='student_types.png'):
        """
        Create bar chart showing distribution of student types
        
        Parameters:
        -----------
        analyzer_profiles : dict
            Student type classifications
        output_file : str
            Output file path
        """
        fig, ax = plt.subplots(figsize=(10, 6))
        
        types = ['Linear\nProgressors', 'Breakthrough\nPerformers', 
                'Variable\nPerformers', 'Exceptional\nPerformers']
        counts = [
            len(analyzer_profiles['linear_progressors']),
            len(analyzer_profiles['breakthrough_performers']),
            len(analyzer_profiles['variable_performers']),
            len(analyzer_profiles['exceptional_performers'])
        ]
        percentages = [count/sum(counts)*100 for count in counts]
        colors_list = [self.colors['linear'], self.colors['breakthrough'],
                       self.colors['variable'], self.colors['exceptional']]
        
        bars = ax.bar(types, counts, color=colors_list, alpha=0.8, edgecolor='black', linewidth=1.5)
        
        # Add value labels on bars
        for bar, count, pct in zip(bars, counts, percentages):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{count}\n({pct:.1f}%)',
                   ha='center', va='bottom', fontweight='bold')
        
        ax.set_ylabel('Number of Students', fontsize=11, fontweight='bold')
        ax.set_title('Classical Guitar Student Distribution by Trajectory Type', 
                    fontsize=13, fontweight='bold')
        ax.set_ylim(0, max(counts) * 1.15)
        ax.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✓ Student types chart saved: {output_file}")
        plt.close()
    
    def plot_score_distribution_by_semester(self, output_file='score_distribution.png'):
        """
        Create box plots showing score distribution by semester
        
        Parameters:
        -----------
        output_file : str
            Output file path
        """
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Combine all scores
        self.data['total_score'] = (self.data['technical_score'] + 
                                     self.data['artistic_score'] + 
                                     self.data['performance_score'])
        
        semester_order = sorted(self.data['semester'].unique())
        box_data = [self.data[self.data['semester'] == sem]['total_score'].values 
                   for sem in semester_order]
        
        bp = ax.boxplot(box_data, labels=[f'S{sem}' for sem in semester_order],
                       patch_artist=True, widths=0.6)
        
        # Color the boxes
        for patch in bp['boxes']:
            patch.set_facecolor(self.colors['linear'])
            patch.set_alpha(0.7)
        
        for element in ['whiskers', 'fliers', 'means', 'medians', 'caps']:
            plt.setp(bp[element], color='black', linewidth=1.5)
        
        ax.set_xlabel('Semester', fontsize=11, fontweight='bold')
        ax.set_ylabel('Total Score (out of 110)', fontsize=11, fontweight='bold')
        ax.set_title('Distribution of Total Scores by Semester', fontsize=13, fontweight='bold')
        ax.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✓ Score distribution chart saved: {output_file}")
        plt.close()
    
    def plot_heatmap_semester_performance(self, output_file='heatmap_performance.png'):
        """
        Create heatmap of average scores by semester
        
        Parameters:
        -----------
        output_file : str
            Output file path
        """
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Create pivot table
        pivot_data = self.data.pivot_table(
            values='technical_score',
            index='semester',
            aggfunc='mean'
        )
        
        # Create performance matrix
        perf_matrix = np.zeros((8, 3))
        for sem in range(1, 9):
            sem_data = self.data[self.data['semester'] == sem]
            perf_matrix[sem-1, 0] = sem_data['technical_score'].mean()
            perf_matrix[sem-1, 1] = sem_data['artistic_score'].mean()
            perf_matrix[sem-1, 2] = sem_data['performance_score'].mean()
        
        im = ax.imshow(perf_matrix.T, cmap='YlOrRd', aspect='auto')
        
        ax.set_xticks(range(8))
        ax.set_xticklabels([f'S{i+1}' for i in range(8)])
        ax.set_yticks(range(3))
        ax.set_yticklabels(['Technical', 'Artistic', 'Performance'])
        
        ax.set_xlabel('Semester', fontsize=11, fontweight='bold')
        ax.set_title('Performance Score Heatmap Across Semesters', fontsize=13, fontweight='bold')
        
        # Add text annotations
        for i in range(3):
            for j in range(8):
                text = ax.text(j, i, f'{perf_matrix[j, i]:.1f}',
                             ha="center", va="center", color="black", fontweight='bold')
        
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Average Score', fontweight='bold')
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✓ Performance heatmap saved: {output_file}")
        plt.close()
    
    def plot_individual_progression(self, student_id, output_file=None):
        """
        Create line plot for individual student progression
        
        Parameters:
        -----------
        student_id : str
            Student ID
        output_file : str
            Output file path (optional)
        """
        student_data = self.data[self.data['student_id'] == student_id].sort_values('semester')
        
        if len(student_data) == 0:
            print(f"✗ Student {student_id} not found")
            return
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        semesters = student_data['semester'].values
        technical = student_data['technical_score'].values
        artistic = student_data['artistic_score'].values
        performance = student_data['performance_score'].values
        
        ax.plot(semesters, technical, marker='o', label='Technical', linewidth=2, markersize=8)
        ax.plot(semesters, artistic, marker='s', label='Artistic', linewidth=2, markersize=8)
        ax.plot(semesters, performance, marker='^', label='Performance', linewidth=2, markersize=8)
        
        ax.set_xlabel('Semester', fontsize=11, fontweight='bold')
        ax.set_ylabel('Score', fontsize=11, fontweight='bold')
        ax.set_title(f'Student {student_id} - Performance Progression', fontsize=13, fontweight='bold')
        ax.legend(fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_xticks(range(1, 9))
        
        if output_file is None:
            output_file = f'student_{student_id}_progression.png'
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✓ Individual progression chart saved: {output_file}")
        plt.close()
    
    def plot_semester_phases(self, output_file='semester_phases.png'):
        """
        Create visualization showing the 4 main phases
        
        Parameters:
        -----------
        output_file : str
            Output file path
        """
        fig, ax = plt.subplots(figsize=(14, 6))
        
        phases = [
            {'name': 'Foundation\nBuilding', 'semesters': '1-2', 'color': '#E8F4F8', 'x': 1.5},
            {'name': 'Skill\nConsolidation', 'semesters': '3-4', 'color': '#D4E8F0', 'x': 3.5},
            {'name': 'Advanced\nDevelopment', 'semesters': '5-6', 'color': '#C0DDE8', 'x': 5.5},
            {'name': 'Mastery &\nSpecialization', 'semesters': '7-8', 'color': '#A8D0E0', 'x': 7.5}
        ]
        
        semester_data = self.data.groupby('semester')['technical_score'].mean()
        
        # Plot background phases
        for phase in phases:
            rect = mpatches.Rectangle((float(phase['semesters'].split('-')[0])-0.4, 0),
                                     2, 45, facecolor=phase['color'],
                                     edgecolor='black', linewidth=2, alpha=0.7)
            ax.add_patch(rect)
        
        # Plot progression line
        semesters = sorted(semester_data.index)
        scores = semester_data[semesters].values
        ax.plot(semesters, scores, marker='o', linewidth=3, markersize=10,
               color='#2E86AB', label='Technical Score Progression', zorder=5)
        
        # Add phase labels
        for phase in phases:
            ax.text(phase['x'], 42, phase['name'], ha='center', fontsize=11, fontweight='bold')
            ax.text(phase['x'], 2, phase['semesters'], ha='center', fontsize=10, style='italic')
        
        ax.set_xlabel('Semester', fontsize=12, fontweight='bold')
        ax.set_ylabel('Average Technical Score', fontsize=12, fontweight='bold')
        ax.set_title('Classical Guitar 4-Year Program - Learning Phases', fontsize=14, fontweight='bold')
        ax.set_xlim(0.5, 8.5)
        ax.set_ylim(0, 45)
        ax.set_xticks(range(1, 9))
        ax.grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✓ Semester phases chart saved: {output_file}")
        plt.close()
    
    def plot_comparison_all_scores(self, output_file='all_scores_comparison.png'):
        """
        Create comparison of all three score types across semesters
        
        Parameters:
        -----------
        output_file : str
            Output file path
        """
        fig, ax = plt.subplots(figsize=(12, 6))
        
        semester_stats = self.data.groupby('semester').agg({
            'technical_score': 'mean',
            'artistic_score': 'mean',
            'performance_score': 'mean'
        }).reset_index()
        
        x = np.arange(len(semester_stats))
        width = 0.25
        
        bars1 = ax.bar(x - width, semester_stats['technical_score'], width, 
                      label='Technical', color=self.colors['linear'], alpha=0.8)
        bars2 = ax.bar(x, semester_stats['artistic_score'], width,
                      label='Artistic', color=self.colors['breakthrough'], alpha=0.8)
        bars3 = ax.bar(x + width, semester_stats['performance_score'], width,
                      label='Performance', color=self.colors['variable'], alpha=0.8)
        
        ax.set_xlabel('Semester', fontsize=11, fontweight='bold')
        ax.set_ylabel('Average Score', fontsize=11, fontweight='bold')
        ax.set_title('Average Scores by Category and Semester', fontsize=13, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels([f'S{i+1}' for i in range(len(semester_stats))])
        ax.legend(fontsize=10)
        ax.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✓ Score comparison chart saved: {output_file}")
        plt.close()
    
    def create_all_visualizations(self, analyzer_profiles):
        """
        Generate all visualizations
        
        Parameters:
        -----------
        analyzer_profiles : dict
            Student type classifications
        """
        print("\nGenerating visualizations...")
        print("-"*60)
        
        self.plot_semester_progression()
        self.plot_student_trajectory_types(analyzer_profiles)
        self.plot_score_distribution_by_semester()
        self.plot_heatmap_semester_performance()
        self.plot_semester_phases()
        self.plot_comparison_all_scores()
        
        # Generate individual student charts (first 3 students)
        for student_id in self.data['student_id'].unique()[:3]:
            self.plot_individual_progression(student_id)
        
        print("-"*60)
        print("✓ All visualizations generated!")


# Example usage
if __name__ == "__main__":
    print("Classical Guitar Visualization Module")
    print("="*60)
    
    # Load sample data
    try:
        data = pd.read_csv('sample_student_data.csv')
        print(f"✓ Data loaded: {len(data)} records")
        
        # Create visualizer
        visualizer = GuitarDataVisualizer(data)
        
        # Note: For complete execution, you would also load analyzer_profiles
        # from the analysis module
        mock_profiles = {
            'linear_progressors': [{'student_id': 'STU001', 'score': 85}] * 15,
            'breakthrough_performers': [{'student_id': 'STU016', 'score': 82}] * 2,
            'variable_performers': [{'student_id': 'STU018', 'score': 75}] * 2,
            'exceptional_performers': [{'student_id': 'STU019', 'score': 90}] * 1
        }
        
        visualizer.create_all_visualizations(mock_profiles)
        
    except FileNotFoundError:
        print("✗ sample_student_data.csv not found")
        print("  Please run guitar_data_analysis.py first to create sample data")
