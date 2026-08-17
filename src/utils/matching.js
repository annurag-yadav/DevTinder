// helper function to normalize strings for comparison
const normalize = (value) => {
    return String(value || "").trim().toLowerCase();
};

// 1. DOMAIN SCORE 40 points 
const calculateDomainScore = (loggedInUser, candidateUser) => {

    const userDomains = loggedInUser.domains || [];
    const candidateDomains = candidateUser.domains || [];

    // If the logged-in user has no domains,
    // we cannot calculate domain similarity.
    if (userDomains.length === 0) {
        return 0;
    }

    const normalizedUserDomains = userDomains.map(normalize);
    const normalizedCandidateDomains = candidateDomains.map(normalize);

    // Find common domains
    const commonDomains = normalizedUserDomains.filter(
        (domain) => normalizedCandidateDomains.includes(domain)
    );

    // Maximum domain score = 40
    const score =
        (commonDomains.length / normalizedUserDomains.length) * 40;

    return Math.min(score, 40);
};

// 2. SKILL SCORE 35 points
const calculateSkillScore = (loggedInUser, candidateUser) => {

    const userSkills = loggedInUser.skills || [];
    const candidateSkills = candidateUser.skills || [];

    // Beginner may have no skills.
    // In that case skill score is simply 0.
    if (userSkills.length === 0) {
        return 0;
    }

    const normalizedUserSkills = userSkills.map(normalize);
    const normalizedCandidateSkills = candidateSkills.map(normalize);

    // Find common skills
    const commonSkills = normalizedUserSkills.filter(
        (skill) => normalizedCandidateSkills.includes(skill)
    );

    // Maximum skill score = 35
    const score =
        (commonSkills.length / normalizedUserSkills.length) * 35;

    return Math.min(score, 35);
};

// 3. EXPERIENCE SCORE 10 points 
// 0-6 months = 10 points 
// 6-12 months = 8 points
// 12-24 months = 5 points 
// 24-48 months = 2 points 
// >48 months = 0 points
const calculateExperienceScore = (loggedInUser, candidateUser) => {

    const userExperience = Number(
        loggedInUser.experienceMonths || 0
    );

    const candidateExperience = Number(
        candidateUser.experienceMonths || 0
    );

    const difference = Math.abs(
        userExperience - candidateExperience
    );

    if (difference <= 6) {
        return 10;
    }

    if (difference <= 12) {
        return 8;
    }

    if (difference <= 24) {
        return 5;
    }

    if (difference <= 48) {
        return 2;
    }

    return 0;
};


// 4. STATUS & ROLE SCORE 10 points
// Same status = 6 points
// Same role = 4 points
// Different status/role = 0 points

const calculateStatusRoleScore = (loggedInUser, candidateUser) => {

    let score = 0;

    // Status match
    if (
        normalize(loggedInUser.currentStatus) !== "" &&
        normalize(loggedInUser.currentStatus) ===
        normalize(candidateUser.currentStatus)
    ) {
        score += 6;
    }

    // Role match
    if (
        normalize(loggedInUser.role) !== "" &&
        normalize(loggedInUser.role) ===
        normalize(candidateUser.role)
    ) {
        score += 4;
    }

    return score;
};

// 5. ORGANIZATION SCORE 5 points
const calculateOrganizationScore = (
    loggedInUser,
    candidateUser
) => {

    const userOrganization = normalize(
        loggedInUser.organization
    );

    const candidateOrganization = normalize(
        candidateUser.organization
    );

    // If either user has no organization,
    // no organization points are given.
    if (
        userOrganization === "" ||
        candidateOrganization === ""
    ) {
        return 0;
    }

    if (userOrganization === candidateOrganization) {
        return 5;
    }

    return 0;
};

// final match score calculation
const calculateMatchScore = (
    loggedInUser,
    candidateUser
) => {

    const domainScore = calculateDomainScore(
        loggedInUser,
        candidateUser
    );

    const skillScore = calculateSkillScore(
        loggedInUser,
        candidateUser
    );

    const experienceScore = calculateExperienceScore(
        loggedInUser,
        candidateUser
    );

    const statusRoleScore = calculateStatusRoleScore(
        loggedInUser,
        candidateUser
    );

    const organizationScore = calculateOrganizationScore(
        loggedInUser,
        candidateUser
    );

    // Add all scores
    const totalScore =
        domainScore +
        skillScore +
        experienceScore +
        statusRoleScore +
        organizationScore;

    // Round to 2 decimal places
    const finalScore = Number(
        totalScore.toFixed(2)
    );

    return {
        matchScore: finalScore,

        breakdown: {
            domainScore: Number(domainScore.toFixed(2)),
            skillScore: Number(skillScore.toFixed(2)),
            experienceScore: experienceScore,
            statusRoleScore: statusRoleScore,
            organizationScore: organizationScore
        }
    };
};

module.exports = {
    calculateDomainScore,
    calculateSkillScore,
    calculateExperienceScore,
    calculateStatusRoleScore,
    calculateOrganizationScore,
    calculateMatchScore
};