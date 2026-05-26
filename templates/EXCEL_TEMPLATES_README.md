# Classical Guitar Case Study - Excel Data Entry Templates

This directory contains pre-formatted Excel templates for data collection and management.

## File Descriptions

### 1. Student_Performance_Tracker.xlsx
**Purpose**: Track individual student performance across all 8 semesters

**Sheets Included**:
- **Student_List**: Master list of all students
- **Sem1 through Sem8**: Individual semester performance data
- **Summary**: Aggregate progress overview
- **Calculations**: Auto-calculated statistics

**How to Use**:
1. Open the file
2. Enter student IDs and names in "Student_List" sheet
3. For each semester, fill in scores (Technical, Artistic, Performance)
4. Summary sheet auto-updates with averages and trends
5. Use color-coding: Green (excellent), Yellow (good), Orange (needs improvement)

---

### 2. Concierto_Repertoire_Log.xlsx
**Purpose**: Track concierto pieces studied across the program

**Sheets Included**:
- **Repertoire_Master**: All pieces attempted/completed
- **By_Semester**: Organized by semester
- **By_Difficulty**: Organized by complexity level
- **Completion_Status**: Track which pieces were mastered

**Columns**:
- Student ID
- Piece Title
- Composer
- Difficulty Level (1-10)
- Date Started
- Date Completed
- Status (In Progress / Mastered / Incomplete)
- Notes

---

### 3. Interview_Data_Entry.xlsx
**Purpose**: Organize and code qualitative interview responses

**Sheets Included**:
- **Interview_Schedule**: Track interview dates/times
- **Interview_Responses**: Raw response entry
- **Code_Analysis**: Thematic coding
- **Student_Narratives**: Organized student quotes

**How to Use**:
1. Schedule interviews in "Interview_Schedule"
2. Record responses in "Interview_Responses"
3. Use "Code_Analysis" for thematic coding
4. Extract key quotes in "Student_Narratives"

---

### 4. Assessment_Rubric_Calculator.xlsx
**Purpose**: Streamline scoring and generate rubric feedback

**Sheets Included**:
- **Score_Entry**: Input individual assessment scores
- **Rubric_Levels**: Pre-defined rubric standards
- **Auto_Calculation**: Automatic total score calculation
- **Feedback_Generator**: Auto-generated feedback based on scores
- **Grade_Distribution**: Class-wide grade statistics

**Features**:
- Dropdown menus for consistent scoring
- Automatic feedback generation
- Grade curve calculator
- Distribution analysis

---

### 5. Semester_Comparison.xlsx
**Purpose**: Compare student performance across different semesters

**Sheets Included**:
- **Semester_1vs2**: Compare first two semesters
- **Semester_3vs4**: Compare middle period
- **Semester_5vs6**: Compare advanced period
- **Semester_7vs8**: Compare final period
- **Trend_Analysis**: Overall 4-year trends

**Use For**:
- Identifying improvement patterns
- Spotting plateaus or regressions
- Generating progress reports

---

### 6. Student_Type_Classifier.xlsx
**Purpose**: Classify students into trajectory types

**Sheets Included**:
- **Raw_Data**: Enter all student scores
- **Classification**: Automatic classification logic
- **Type_A_Linear**: Linear Progressors
- **Type_B_Breakthrough**: Breakthrough Performers
- **Type_C_Variable**: Variable Performers
- **Type_D_Exceptional**: Exceptional Performers
- **Summary_Report**: Classification summary

**How It Works**:
1. Enter all student data in "Raw_Data"
2. Formulas automatically classify each student
3. View results in individual type sheets
4. Generate summary report

---

### 7. Practice_Hour_Logger.xlsx
**Purpose**: Track and analyze student practice habits

**Sheets Included**:
- **Daily_Log**: Students enter daily practice hours
- **Weekly_Summary**: Automatic weekly totals
- **Monthly_Analysis**: Monthly patterns
- **Semester_Total**: Total practice hours per semester
- **Correlation_Analysis**: Correlate practice with performance

**Columns**:
- Date
- Hours Practiced
- Focus Area (Technical / Repertoire / Interpretation)
- Notes
- Energy Level (1-10)

---

### 8. Audio_Video_Log.xlsx
**Purpose**: Track performance recordings for analysis

**Sheets Included**:
- **Recording_Inventory**: Master list of all recordings
- **By_Student**: Organized by student
- **By_Semester**: Organized by semester
- **Technical_Analysis**: Technical skill observations
- **Artistic_Analysis**: Artistic development observations

**Columns**:
- Recording ID
- Student ID
- Date
- Piece/Concierto
- Duration
- Venue/Location
- File Path
- Quality Rating
- Notes

---

## Template Features

### All Templates Include:
✓ Drop-down menus for consistent data entry
✓ Color-coding for visual organization
✓ Automatic calculations and summaries
✓ Data validation to prevent errors
✓ Instructions tabs with guidance
✓ Export-ready formatting

### How to Customize:
1. **Add Students**: Row count adjusts automatically
2. **Change Scoring Scale**: Update formulas in calculation sheets
3. **Add Comments**: Use cell comments for notes
4. **Generate Reports**: Use summary sheets for reports
5. **Create Charts**: Pre-formatted chart areas ready for data

---

## Recommended Workflow

### Setup Phase:
1. Fill out Student_List in Performance_Tracker
2. Create interview schedule in Interview_Data_Entry
3. Set up repertoire tracking in Concierto_Repertoire_Log

### Data Collection Phase:
1. Enter semester scores weekly in Performance_Tracker
2. Log practice hours in Practice_Hour_Logger
3. Record audio/video in Audio_Video_Log
4. Conduct and enter interviews

### Analysis Phase:
1. Run Student_Type_Classifier
2. Use Semester_Comparison for trends
3. Analyze correlations in Practice_Hour_Logger
4. Code interviews in Interview_Data_Entry

### Reporting Phase:
1. Generate reports from summary sheets
2. Export data to visualization tools (Python scripts)
3. Create student feedback reports

---

## Tips for Accurate Data Entry

- **Consistency**: Use same terminology across all entries
- **Timeliness**: Enter data weekly, not retroactively
- **Completeness**: Fill all required fields
- **Verification**: Double-check scores before saving
- **Backup**: Save copies regularly
- **Comments**: Add context notes for unusual entries

---

## Data Analysis Integration

These templates export easily to:
- **Python scripts**: `guitar_data_analysis.py`
- **Visualization tools**: `guitar_visualization.py`
- **Statistical software**: SPSS, R, Stata

**Export Format**: CSV or Excel (both supported)

---

## Common Formulas Used

All sheets use Excel formulas like:
- `=AVERAGE()` for mean calculations
- `=STDEV()` for standard deviation
- `=IF()` for conditional logic
- `=COUNTIF()` for categorization
- `=VLOOKUP()` for data organization

No VBA macros - fully transparent and editable

---

## Questions?

For template customization or issues:
1. Check the "Instructions" tab in each sheet
2. Review formula explanations in calculation cells
3. See Case Study document for methodology background

---

**Last Updated**: May 26, 2026
**Version**: 1.0
**Compatible**: Excel 2016 or later, Google Sheets
