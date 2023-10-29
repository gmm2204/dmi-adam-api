SELECT SUM(ScreenedNumber) ScreenedNumber,
    EpiWeek,
    Month,
    Year
FROM (
        SELECT CASE
                WHEN Screened = 1 then 1
                else 0
            end ScreenedNumber,
            P.Facility as FacilityID,
            P.ReviewDate,
            P.EpiWeek
        FROM [dbo].[FactMortality] p
    ) A
    INNER JOIN DimDate D On A.ReviewDate = D.DateKey
    INNER JOIN DimFacility F on A.FacilityId = F.FacilityId --{{WHERE}}--
GROUP BY EpiWeek,
    Month,
    Year;